import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { useEffect, useRef, useState } from 'react';

const LINKING_ERROR =
  `The package 'react-native-theme-switch-animation' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const ThemeSwitchAnimation = NativeModules.ThemeSwitchAnimationModule
  ? NativeModules.ThemeSwitchAnimationModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

type AnimationConfig = {
  type: 'fade' | 'circular' | 'circular-inverted';
  duration: number;
};

type ThemeSwitcherHookProps = {
  switchThemeFunction: () => void;
  animationConfig?: AnimationConfig;
};

const useThemeSwitcher = () => {
  const switchFunctionRef = useRef(() => {
    return;
  });

  const [localAnimationConfig, setLocalAnimationConfig] =
    useState<AnimationConfig>({
      type: 'fade',
      duration: 5000,
    });

  useEffect(() => {
    const subscription = new NativeEventEmitter(
      NativeModules.ThemeSwitchAnimationModule
    ).addListener('FINISHED_FREEZING_SCREEN', () => {
      setTimeout(() => {
        if (switchFunctionRef.current) {
          switchFunctionRef.current();
        }
        ThemeSwitchAnimation.unfreezeScreen(
          localAnimationConfig.type,
          localAnimationConfig.duration
        );
      }, 20);
    });
    console.log('registered listener');

    return () => {
      console.log('unregistered listener');
      subscription.remove();
    };
  }, [localAnimationConfig]);

  const switchTheme = ({
    switchThemeFunction,
    animationConfig,
  }: ThemeSwitcherHookProps) => {
    setLocalAnimationConfig(animationConfig || localAnimationConfig);
    ThemeSwitchAnimation.freezeScreen();
    switchFunctionRef.current = switchThemeFunction;
  };

  return {
    switchTheme: switchTheme,
  };
};

export default useThemeSwitcher;
