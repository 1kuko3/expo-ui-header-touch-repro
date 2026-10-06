import { Button, View } from 'react-native';

import { router } from 'expo-router';

export default function Details() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Button title="Go back" onPress={() => router.back()} />
    </View>
  );
}
