import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Text as ComposeText, Host, IconButton, RNHostView, Row } from '@expo/ui/jetpack-compose';
import { router, Stack, useIsFocused } from 'expo-router';

// Set to true to remount the Host when the hosted view appears. That works around the bug.
const REMOUNT_HOST = false;

export default function Index() {
  const isFocused = useIsFocused();
  const [hasBlurred, setHasBlurred] = useState(false);
  if (!isFocused && !hasBlurred) setHasBlurred(true);
  // The hosted view appears once the screen is focused again after another screen covered it.
  const showHostedView = hasBlurred && isFocused;

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Stack.Toolbar placement="left" asChild>
        <Host
          matchContents
          key={REMOUNT_HOST && showHostedView ? 'remounted' : 'initial'}
          // @ts-expect-error Host doesn't declare touch props; used only to show where the touch lands.
          onTouchStart={(e) =>
            console.log('[repro] Host touchStart, target', e.nativeEvent.target)
          }>
          <Row verticalAlignment="center">
            {showHostedView ? (
              <RNHostView matchContents>
                <View
                  collapsable={false}
                  onTouchStart={(e) =>
                    console.log('[repro] hosted wrapper touchStart, target', e.nativeEvent.target)
                  }>
                  <Pressable
                    style={{ width: 40, height: 40, backgroundColor: 'gold' }}
                    onPressIn={() => console.log('[repro] hosted view pressIn')}
                    onPress={() => router.push('/details')}>
                    <Text>M</Text>
                  </Pressable>
                </View>
              </RNHostView>
            ) : (
              <IconButton onClick={() => router.push('/details')}>
                <ComposeText>Go</ComposeText>
              </IconButton>
            )}
          </Row>
        </Host>
      </Stack.Toolbar>
      <Text>1. Tap "Go" in the header to push a screen.</Text>
      <Text>2. Go back.</Text>
      <Text>
        3. Tap the gold "M" box in the header. Nothing happens and pressIn is never logged.
      </Text>
    </View>
  );
}
