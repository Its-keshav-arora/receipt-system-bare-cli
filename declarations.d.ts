declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export default class Feather extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  import { TextStyle, StyleProp } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export default class FontAwesome extends Component<IconProps> {}
}
