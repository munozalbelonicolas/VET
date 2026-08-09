import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 120 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={require('../../../assets/Logo.png')} 
        style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Logo;
