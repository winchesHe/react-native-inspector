import React, { memo, type ReactNode, useEffect, useRef, useState } from 'react'
import { DevSettings, StyleSheet, View } from 'react-native'
import { useInspector } from './useInspector'
import { InspectorHighlight } from './InspectorHighlight'
import { InspectorPopover } from './InspectorPopover'
import { stringifyPropsForDisplay } from '../utils/stringifyPropsForDisplay'
import { BLOCKED_COMPONENTS } from '../utils/constants'

interface InspectorWrapperProps {
  children: ReactNode
  blockComponents?: string[]
}

// types moved into hook

export const InspectorWrapper: React.FC<InspectorWrapperProps> = memo<InspectorWrapperProps>(props => {
  const { children, blockComponents = BLOCKED_COMPONENTS } = props
  const wrapperRef = useRef<View>(null)
  const [isInspectorEnabled, setIsInspectorEnabled] = useState(false)
  const { panHandlers, highlightInfo, popoverInfo, reset } = useInspector({
    wrapperRef,
    isInspectorEnabled,
    blockComponents,
  })

  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Inspector', () => {
        setIsInspectorEnabled(prev => !prev)
        reset()
      })
    }
  }, [reset])

  if (!__DEV__) {
    return children
  }

  return (
    <View style={styles.container} ref={wrapperRef} {...(isInspectorEnabled ? panHandlers : {})}>
      {children}

      {isInspectorEnabled && highlightInfo && (
        <InspectorHighlight
          x={highlightInfo.x}
          y={highlightInfo.y}
          width={highlightInfo.width}
          height={highlightInfo.height}
        />
      )}

      {isInspectorEnabled && highlightInfo && popoverInfo?.frame && (
        <InspectorPopover
          x={highlightInfo.x}
          y={highlightInfo.y + highlightInfo.height + 6}
          title={popoverInfo.hierarchy?.[popoverInfo.selectedIndex ?? 0]?.name || 'Component'}
          sizeText={`${Math.round(popoverInfo.frame.width)}×${Math.round(popoverInfo.frame.height)}`}
          propsText={
            popoverInfo.props
              ? stringifyPropsForDisplay(popoverInfo.props, { maxDepth: 2, maxKeys: 20, maxString: 300 })
              : undefined
          }
          source={popoverInfo.source}
          styleText={
            popoverInfo.style
              ? stringifyPropsForDisplay(popoverInfo.style, { maxDepth: 2, maxKeys: 20, maxString: 300 })
              : undefined
          }
          ancestorsSources={popoverInfo.ancestorsSources}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
  },
  // highlight & popover moved into components
})
