# Expo UI: RNHostView in a native-stack header stops receiving touches after navigating back (Android)

## Summary

On Android, a `RNHostView` that is added to a Jetpack Compose `Host` inside a native-stack
header (`Stack.Toolbar asChild`) does not receive touches if the screen was covered by another
screen and then uncovered. Taps land on the `Host`. The hosted `Pressable` never gets `pressIn`.

The bug needs all of these:

- The `Host` is in the header (`Stack.Toolbar placement="left" asChild`). The same `Host` in the
  screen body works.
- The screen was covered (push) and uncovered (back) before the `RNHostView` is added. If it is
  added on a timer with no navigation, it works. If it is added 1.5 s after going back, it still fails.
- The view is inside an Expo UI `Host`. A plain React Native `Pressable` mounted the same way in the
  same header works.

Remounting the `Host` (changing its `key`) when the hosted view appears makes it tappable again.
Set `REMOUNT_HOST = true` in `app/index.tsx` to see that.

## Triage

Native hit-testing is correct; the touch is delivered to the wrong place in JS.

- The tap reaches JS with the right target. The repro logs `onTouchStart` on the `Host` and on the
  `View` wrapping the `Pressable`. In the failing case the `Host` logs a target equal to the tag of
  the hosted `Text`, the same tag `adb shell dumpsys activity` shows for that view.
- The event still never reaches the hosted subtree. The wrapper `View`, which sits between the
  `Host` and that target in the React tree, gets no `onTouchStart` and no responder capture call,
  so the `Pressable` never becomes the responder.
- With `REMOUNT_HOST = true`, the wrapper gets `onTouchStart`, then the `Host` does, then `pressIn`
  fires.

Native view hierarchy in the failing case (from `dumpsys activity`):

```
ScreenStackHeaderSubview
  expo.modules.ui.HostView                     0,0-105,105
    expo.modules.kotlin.views.ComposeFunctionHolder 0,0-105,105   <- 0,0-0,0 in the working case
      expo.modules.ui.RNHostView               0,0-0,0
    ComposeView > ... > ViewFactoryHolder > TouchDispatchingRootViewGroup
      ReactViewGroup > ReactViewGroup > ReactTextView   (the hosted Pressable and Text)
```

The only structural difference from the working case is that `ComposeFunctionHolder`, which was
created before navigating, has been laid out to the full `Host` size. In the working case it's
newly created and zero-sized. react-native-screens removes all header subviews from the toolbar
and adds them back when the screen is updated on focus (`ScreenStackHeaderConfig.onUpdate`), so
this Android layout pass is a likely source. We haven't confirmed whether that is what breaks
the JS event path.

## Steps

1. `npm install`, then `npx expo run:android`. The repo's `.npmrc` sets `legacy-peer-deps=true`
   because react-native-reanimated's peer range (`0.86 - 0.88`) doesn't match `0.88.0-rc.3`.
2. Tap "Go" in the header. The details screen is pushed.
3. Go back (button or system back).
4. Tap the gold "M" box in the header.

Expected: `[repro] hosted view pressIn` is logged and the details screen opens.

Actual: nothing happens. Only `[repro] Host touchStart, target <tag>` is logged.

## Environment

- expo 58.0.5, expo-router 58.0.15, @expo/ui 58.0.13
- react-native 0.88.0-rc.3, react-native-screens 4.28.0
- New Architecture, debug build, Pixel 7a, Android 17
- Android only. iOS not checked.
