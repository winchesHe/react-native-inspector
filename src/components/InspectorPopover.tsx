import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export interface InspectorPopoverProps {
  x: number;
  y: number; // top-left origin of popover
  title: string;
  sizeText: string;
  propsText?: string;
  source?: { file?: string; line?: number; column?: number } | any;
  styleText?: string;
  ancestorsSources?: Array<{ name?: string; source?: { file?: string; line?: number; column?: number } | any }>;
}

const formatSourceLoc = (src?: { file?: string; line?: number; column?: number } | any) => {
  if (!src?.file) return 'N/A';
  const line = src.line != null ? `:${src.line}` : '';
  const col = src.column != null ? `:${src.column}` : '';
  return `${src.file}${line}${col}`;
};

export const InspectorPopover: React.FC<InspectorPopoverProps> = ({
  x,
  y,
  title,
  sizeText,
  propsText,
  source,
  styleText,
  ancestorsSources,
}) => {
  const showAncestors = Array.isArray(ancestorsSources) && ancestorsSources.length > 0;
  return (
    <View style={[styles.popover, { left: x, top: y }]} pointerEvents="none">
      <Text style={styles.popoverTitle}>{title}</Text>

      {showAncestors ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ancestor Sources (up to 5)</Text>
          {ancestorsSources!.map((item, idx) => (
            <Text key={idx} style={styles.popoverText} numberOfLines={2}>
              {`${idx + 1}. ${item.name || 'Anonymous'} -> ${formatSourceLoc(item.source)}`}
            </Text>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            <Text style={styles.popoverText} numberOfLines={2}>
              {formatSourceLoc(source)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <Text style={styles.popoverText}>{sizeText}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style</Text>
            <Text numberOfLines={3} style={styles.popoverCode}>
              {styleText || 'N/A'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Props</Text>
            <Text numberOfLines={3} style={styles.popoverCode}>
              {propsText || 'N/A'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    maxWidth: 300,
    borderColor: 'rgba(0,0,0,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10000,
  },
  popoverTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  popoverText: {
    color: '#333',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  popoverCode: {
    color: '#666',
  },
  openBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1677ff',
    borderRadius: 4,
  },
  openBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
