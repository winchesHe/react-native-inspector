import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { findNodeHandle, PanResponder, type PanResponderInstance, View } from 'react-native';
import { getDevServerBaseURL } from '../devServer';

export interface HighlightInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverInfo {
  frame?: { left: number; top: number; width: number; height: number };
  props?: any;
  hierarchy?: any[];
  selectedIndex?: number;
  source?: any;
  style?: any;
  // Up to 5 ancestor components' source info (when not blocked)
  ancestorsSources?: Array<{
    name?: string;
    source?: { file?: string; line?: number; column?: number } | any;
  }>;
}



export function useInspector(params: { wrapperRef: RefObject<View | null>; isInspectorEnabled: boolean; blockComponents: string[] }) {
  const { wrapperRef, isInspectorEnabled, blockComponents } = params;
  const [highlightInfo, setHighlightInfo] = useState<HighlightInfo | null>(null);
  const [popoverInfo, setPopoverInfo] = useState<PopoverInfo | null>(null);
  const baseURL = getDevServerBaseURL();

  const isBlockedComponent = (componentName: string): boolean => {
    return blockComponents.some((blockedComponent) => componentName.toLowerCase().includes(blockedComponent));
  };

  const openInEditor = (file: string) => {
    if (!baseURL || !file) return;
    fetch(`${baseURL}/__open-in-editor?file=${encodeURIComponent(file)}`).catch(() => { });
  };

  const findComponentAtPoint = useCallback(
    (pageXInput: number, pageYInput: number) => {
      if (!wrapperRef.current) return;

      wrapperRef.current.measure((fx, fy, width, height, pageX, pageY) => {
        if (!__DEV__) return;

        const localX = pageXInput - pageX;
        const localY = pageYInput - pageY;

        const onInspectorData = (data: any) => {
          try {
            const frame = data?.frame;
            const source = getSourceFromNodeClosestFiber(data);
            const style = data?.props?.style;

            // Collect up to 5 ancestor sources from Fiber.return chain
            const ancestorsSources: Array<{ name?: string; source?: any }> = [];
            try {
              let node = data?.closestInstance?.return;
              while (node && ancestorsSources.length < 5) {
                const aSource = getSourceFromNodeFiber(node);
                const displayName =
                  node?.elementType?.displayName ||
                  node?.type?.displayName ||
                  node?.elementType?.name ||
                  node?.type?.name ||
                  (typeof node?.elementType === 'string' ? node.elementType : undefined);
                ancestorsSources.push({ name: displayName, source: aSource });
                node = node.return;
              }
            } catch { }

            if (frame && typeof frame.left === 'number' && typeof frame.top === 'number') {
              setHighlightInfo({
                x: Math.max(0, frame.left - pageX),
                y: Math.max(0, frame.top - pageY),
                width: Math.max(0, frame.width ?? 0),
                height: Math.max(0, frame.height ?? 0),
              });

              const componentKey = source.file || '';
              const canOpenInEditor = source && !isBlockedComponent(componentKey);

              setPopoverInfo({
                frame,
                props: data?.props,
                hierarchy: data?.hierarchy,
                selectedIndex: data?.selectedIndex,
                source,
                style,
                ancestorsSources: !canOpenInEditor ? ancestorsSources : undefined,
              });

              if (canOpenInEditor) {
                const fileForOpen = String(source.file || '');
                openInEditor(`${fileForOpen}:${source.line}:${source.column}`);
              } else {
                const filteredAncestorsSources = [
                  ...new Set(
                    ancestorsSources
                      .map((item) =>
                        item.source?.file ? `${item.source.file}:${item.source.line}:${item.source.column}` : '',
                      )
                      .filter((item) => !!item && !item.includes('node_modules')),
                  ),
                ];

                if (filteredAncestorsSources.length) {
                  openInEditor(filteredAncestorsSources[0]);
                } else {
                  console.log('\x1b[31m[Inspector] __inspectorSource 非期望跳转组件:\x1b[0m', source.file);
                  console.log('可能是以下组件之一:\n', filteredAncestorsSources.join('\n'));
                }
              }
            }
          } catch (e) {
            console.warn('[Inspector] log error:', e);
          }
          return false;
        };

        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const getInspectorDataForViewAtPoint = require('react-native/Libraries/Inspector/getInspectorDataForViewAtPoint');
          if (getInspectorDataForViewAtPoint) {
            getInspectorDataForViewAtPoint(wrapperRef.current, localX, localY, onInspectorData);
            return;
          }
        } catch { }

        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const RNPI = require('react-native/Libraries/ReactNative/ReactNativePrivateInterface');
          const FabricUIManager = RNPI?.FabricUIManager;
          const UIManager = RNPI?.UIManager;

          const rootTag = findNodeHandle(wrapperRef.current);
          if (rootTag == null) {
            console.warn('[Inspector] rootTag not found');
            return;
          }

          if (FabricUIManager?.getInspectorDataForViewAtPoint) {
            FabricUIManager.getInspectorDataForViewAtPoint(rootTag, localX, localY, onInspectorData);
          } else if (UIManager?.getInspectorDataForViewAtPoint) {
            UIManager.getInspectorDataForViewAtPoint(rootTag, localX, localY, onInspectorData);
          } else {
            console.warn('[Inspector] getInspectorDataForViewAtPoint is not available. RN version/arch may differ.');
          }
        } catch (error) {
          console.warn('[Inspector] fallback private call failed:', error);
        }
      });
    },
    [wrapperRef],
  );

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isInspectorEnabled,
        onMoveShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => isInspectorEnabled,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (event) => {
          if (!isInspectorEnabled) return;
          const { pageX, pageY } = event.nativeEvent;
          findComponentAtPoint(pageX, pageY);
        },
      }),
    [isInspectorEnabled, findComponentAtPoint],
  );

  const reset = useCallback(() => {
    setHighlightInfo(null);
    setPopoverInfo(null);
  }, []);

  return {
    panHandlers: panResponder.panHandlers,
    highlightInfo,
    popoverInfo,
    reset,
  } as const;
}

const getSourceFromNodeClosestFiber = (node: any) => {
  return (
    node?.closestInstance?.memoizedProps?.__inspectorSource ||
    node?.closestInstance?.props?.__inspectorSource ||
    node?.closestInstance?.pendingProps?.__inspectorSource
  );
};

const getSourceFromNodeFiber = (node: any) => {
  return (
    node?.memoizedProps?.__inspectorSource || node?.props?.__inspectorSource || node?.pendingProps?.__inspectorSource
  );
};
