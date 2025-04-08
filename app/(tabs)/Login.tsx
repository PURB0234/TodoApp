import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/style/signIn_style';
import { loginControl } from '@/utils/loginControl';

// const db = getFirestore();

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <View style={styles.vInput}>
          <Ionicons name='mail' size={17} color={'black'} style={{ padding: 10 }} />
          <TextInput style={{ flex: 1 }} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {/* <Ionicons name="person" size={17} color="black" style={{ padding: 10 }} /> */}
        </View>
        <View style={styles.vInput}>
          <Ionicons name='lock-closed-sharp' size={17} color={'black'} style={{ padding: 10 }} />
          <TextInput style={{ flex: 1 }} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={17} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => loginControl(email, password)}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <View style={styles.switchContainer}>
          <Text style={{ fontSize: 14 }}>Belum punya akun?</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Register')}>
            <Text style={styles.switchText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Login;