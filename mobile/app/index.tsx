import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Image
          source={require('../assets/Matboksen_Logo_Tekst_versjon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          Skann strekkoder og få AI-drevet prisvurdering
        </Text>
        <Text style={styles.subtitle2}>
          Sammenlign med fellesskapet
        </Text>
        <Text style={styles.subtitle3}>
          Følg prisutvikling!
        </Text>
      </View>

      <Image
        source={require('../assets/Mascot_scanning.png')}
        style={styles.logo2}
        resizeMode="contain"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/scanner')}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="camera-outline" size={24} color="#6744c9" />
            <Text style={styles.primaryButtonText}>Skann produkt</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/community')}
        >
          <View style={styles.buttonContent}>
            <MaterialIcons name="groups" size={20} color="#fff" />
            <Text style={styles.secondaryButtonText}>Fellesskapspriser</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/history')}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="bar-chart-outline" size={20} color="#fff" />
            <Text style={styles.secondaryButtonText}>Se historikk</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/receipt-scanner')}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="receipt-outline" size={20} color="#fff" />
            <Text style={styles.secondaryButtonText}>Skann kvittering</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Norsk markedskontekst • AI-drevet analyse
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            av John-Kristian G. Ruud
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8966d8',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '2b2757',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 3,
    marginTop: '-30%',
    lineHeight: 12,
  },
  subtitle2: {
    fontSize: 12,
    color: '2b2757',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 3,
    lineHeight: 12,
  },
  subtitle3: {
    fontSize: 12,
    color: '2b2757',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 0,
    lineHeight: 12,
  },
  logo: {
    width: '110%',
    marginTop: '-20%',
    height: undefined,
    aspectRatio: 1.47,
  },
  logo2: {
    width: '170%',
    height: 300,
    alignSelf: 'center',
    marginVertical: 60,
  },
  buttonContainer: {
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#6744c9',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#6744c9',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
