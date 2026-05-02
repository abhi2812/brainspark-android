import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';

export default function GameHeader({ left, center, right, showBack = true }) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.slot}>{left}</View>
      )}
      <View style={styles.centerSlot}>
        {typeof center === 'string' ? <Text style={styles.centerText}>{center}</Text> : center}
      </View>
      <View style={styles.slot}>
        {typeof right === 'string' ? <Text style={styles.rightText}>{right}</Text> : right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, color: colors.text },
  slot: { minWidth: 80, alignItems: 'flex-end' },
  centerSlot: { flex: 1, alignItems: 'center' },
  centerText: { fontSize: 16, fontWeight: '700', color: colors.text },
  rightText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
