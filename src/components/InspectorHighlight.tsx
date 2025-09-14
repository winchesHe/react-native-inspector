import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface InspectorHighlightProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const InspectorHighlight: React.FC<InspectorHighlightProps> = ({ x, y, width, height }) => {
  return (
    <View
      style={[
        styles.highlight,
        {
          left: x,
          top: y,
          width,
          height,
        },
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff0000',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    zIndex: 9999,
  },
});
