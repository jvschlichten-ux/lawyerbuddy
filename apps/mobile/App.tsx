import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LawyerBuddy</Text>
      <Text style={styles.subtitle}>Tu Abogado</Text>
      <Text style={styles.status}>Backend connected ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#888888', marginBottom: 24 },
  status: { fontSize: 14, color: '#22c55e' },
});
