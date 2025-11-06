declare module 'react-native-phone-number-input' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface PhoneInputProps extends ViewProps {
    defaultCode?: string;
    layout?: 'first' | 'second';
    onChangeFormattedText?: (text: string) => void;
  }

  export default class PhoneInput extends React.Component<PhoneInputProps> {}
}
