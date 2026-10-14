import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function Home() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Market Store</Text>
      <Text style={styles.subtitle}>Mulungushi University</Text>
      <Text style={styles.body}>
        First run of the mobile app. Item grid, chat, and delivery fee calculator are coming next.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  body: { fontSize: 14, color: '#999', textAlign: 'center' }
});
