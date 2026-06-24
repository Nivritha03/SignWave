"use client";

import React, { createContext, useState, ReactNode, useContext } from 'react';

export type AvatarStyle = 'maya' | 'alex';

interface AvatarContextProps {
  avatarStyle: AvatarStyle;
  setAvatarStyle: (style: AvatarStyle) => void;
}

export const AvatarContext = createContext<AvatarContextProps>({
  avatarStyle: 'maya',
  setAvatarStyle: () => {}
});

export const AvatarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('maya');
  return (
    <AvatarContext.Provider value={{ avatarStyle, setAvatarStyle }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  return {
    style: context.avatarStyle,
    setStyle: context.setAvatarStyle
  };
};

