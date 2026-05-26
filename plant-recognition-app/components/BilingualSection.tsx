import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  en: string;
  zh: string;
}

export function BilingualSection({ title, en, zh }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.enText}>{en}</Text>
      <Text style={styles.zhText}>{zh}</Text>
    </View>
  );
}

interface FactsProps {
  title: string;
  en: string[];
  zh: string[];
}

export function BilingualFacts({ title, en, zh }: FactsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {en.map((fact, i) => (
        <View key={i} style={styles.factRow}>
          <Text style={styles.bullet}>•</Text>
          <View style={styles.factTexts}>
            <Text style={styles.enText}>{fact}</Text>
            {zh[i] && <Text style={styles.zhText}>{zh[i]}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e9',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  enText: {
    fontSize: 15,
    color: '#1b2b1e',
    lineHeight: 22,
  },
  zhText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 21,
    marginTop: 4,
  },
  factRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#52b788',
    marginRight: 8,
    marginTop: 1,
  },
  factTexts: {
    flex: 1,
  },
});
