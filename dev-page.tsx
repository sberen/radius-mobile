import React from "react";
import { View, Button, StyleSheet, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";

const DevPage = () => {
  const nav = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Button title={"Home"} onPress={() => nav.navigate("Home")} />
      <Button
        title={"Business Info"}
        onPress={() => nav.navigate("Business")}
      />
      <Button title={"Register"} onPress={() => nav.navigate("Register")} />
      <Button title={"Login"} onPress={() => nav.navigate("Login")} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
  },
});

export default DevPage;
