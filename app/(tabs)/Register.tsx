import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import styles from '@/style/signUp_style';
import { registerControl } from '@/utils/registerControl';

// const db = getFirestore();

const Register: React.FC = () => {
  // const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Register</Text>
        <View style={styles.vInput}>
          <Ionicons name='mail' size={17} color={'gray'} style={{ padding: 10 }} />
          <TextInput style={{ flex: 1 }} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {/* <Ionicons name="person" size={17} color="black" style={{ padding: 10 }} /> */}
        </View>
        <View style={styles.vInput}>
          <Ionicons name='lock-closed-outline' size={17} color={'gray'} style={{ padding: 10 }} />
          <TextInput style={{ flex: 1 }} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={17} color={'#00000'} />
          </TouchableOpacity>
        </View>
        <View style={styles.vInput}>
          <Ionicons name='lock-closed-sharp' size={17} color={'gray'} style={{ padding: 10 }} />
          <TextInput style={{ flex: 1 }} placeholder="Konfirmasi Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => registerControl(email, password, confirmPassword)}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={styles.switchContainer}>
          <Text style={{ fontSize: 14 }}>Sudah punya akun?</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Login')}>
            <Text style={styles.switchText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Register;
