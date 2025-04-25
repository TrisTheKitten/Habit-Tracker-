import React from 'react';
import * as Icons from 'lucide-react';

// Export the type for possible icon names explicitly
export type IconName = keyof typeof Icons;

interface DynamicIconProps extends Icons.LucideProps {
  name: IconName;
}

/**
 * A component that dynamically renders a Lucide icon based on its name.
 * Provides a fallback if the icon name is invalid or not found.
 */
const DynamicTablerIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Check if the name exists in the imported Icons object
  if (!name || !(name in Icons)) {
    // Fallback icon (e.g., a generic icon or null)
    console.warn(`Icon "${name}" not found in lucide-react. Falling back to CircleHelp.`);
    const FallbackIcon = Icons['CircleHelp']; // Or Icons.HelpCircle, or a default
    return <FallbackIcon {...props} />;
  }

  // Dynamically select the icon component
  const IconComponent = Icons[name] as React.ComponentType<Icons.LucideProps>;

  return <IconComponent {...props} />;
};

export default DynamicTablerIcon;
