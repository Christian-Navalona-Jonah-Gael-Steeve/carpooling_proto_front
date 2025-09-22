import {
  LocationPickerNative,
  LocationPickerValue,
} from "@/components/LocationPickerNative";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function SearchScreen() {
  const [value, setValue] = useState<LocationPickerValue>({
    from: { text: "" },
    to: { text: "" },
  });
  return (
    <View style={styles.container}>
      <LocationPickerNative
        value={value}
        onChange={(v) => {
          setValue(v);
          // Ici tu peux appeler ton backend quand from/to sont tous deux définis:
          // if (v.from.coords && v.to.coords) searchRides(v);
        }}
        initialRegion={{
          latitude: -18.8792,
          longitude: 47.5079,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        defaultClickTarget="from"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
