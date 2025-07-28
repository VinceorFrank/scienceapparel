import React from 'react';
import { usePageAssets } from '../hooks/usePageAssets';
import { useBlockToggle } from '../hooks/useBlockToggle';
import { useHeroSettings } from '../hooks/useHeroSettings';
import LayoutRenderer from '../components/LayoutRenderer';

const About = () => {
  const { data = [] } = usePageAssets('about');
  const { blockOrder, getToggles } = useBlockToggle('about');
  const { buttonPosition, buttonDestination } = useHeroSettings('about');

  // Prepare button settings for LayoutRenderer
  const buttonSettings = {
    hero: {
      position: buttonPosition,
      destination: buttonDestination
    }
  };

  return (
    <LayoutRenderer
      slug="about"
      assets={data}
      toggles={getToggles()}
      blockOrder={blockOrder}
      buttonSettings={buttonSettings}
    />
  );
};

export default About;
