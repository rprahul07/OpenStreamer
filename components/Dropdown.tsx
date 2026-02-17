import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBranding } from '@/contexts/BrandingContext';
import Colors from '@/constants/colors';

// Global state to track open dropdown
let openDropdownId: string | null = null;

// Z-index mapping for different dropdown types
const getZIndex = (dropdownId: string) => {
  switch (dropdownId) {
    case 'department':
      return 3000;
    case 'academic-year':
      return 2000;
    case 'class-section':
      return 1000;
    default:
      return 1500;
  }
};

interface DropdownProps {
  label: string;
  value: string | number | null;
  items: Array<{ value: string | number; label: string }>;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  dropdownId?: string; // Add unique ID for each dropdown
}

export default function Dropdown({
  label,
  value,
  items,
  onSelect,
  placeholder = 'Select an option',
  icon = 'chevron-down-outline',
  disabled = false,
  dropdownId = 'default',
}: DropdownProps) {
  const { branding } = useBranding();
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedItem = items.find(item => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const handleToggle = () => {
    if (disabled) return;
    
    if (openDropdownId === dropdownId) {
      // Close this dropdown
      setIsOpen(false);
      openDropdownId = null;
    } else {
      // Close any other dropdown and open this one
      setIsOpen(false);
      setTimeout(() => {
        setIsOpen(true);
        openDropdownId = dropdownId;
      }, 0);
    }
  };

  const handleSelect = (selectedValue: string | number) => {
    onSelect(selectedValue);
    setIsOpen(false);
    openDropdownId = null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[
          styles.dropdownButton,
          disabled && styles.disabled,
          { borderColor: value ? branding.accentColor : Colors.dark.border },
          { zIndex: isOpen ? getZIndex(dropdownId) + 100 : getZIndex(dropdownId) }
        ]}
        onPress={handleToggle}
        disabled={disabled}
      >
        <View style={styles.selectedContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={value ? branding.accentColor : Colors.dark.textSecondary}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.selectedText,
              value ? styles.selectedTextActive : styles.selectedTextPlaceholder
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color={Colors.dark.textSecondary}
        />
      </Pressable>

      {isOpen && !disabled && (
        <View style={[styles.dropdownList, { 
          zIndex: getZIndex(dropdownId) + 200,
          elevation: 15
        }]}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {items.map((item) => (
              <Pressable
                key={item.value.toString()}
                style={[
                  styles.dropdownItem,
                  item.value === value && { backgroundColor: branding.accentColor + '20' }
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    item.value === value && { color: branding.accentColor }
                  ]}
                >
                  {item.label}
                </Text>
                {item.value === value && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={branding.accentColor}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
    position: 'relative',
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.dark.surface,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  selectedText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    flex: 1,
  },
  selectedTextActive: {
    color: Colors.dark.text,
  },
  selectedTextPlaceholder: {
    color: Colors.dark.textMuted,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginTop: 4,
    maxHeight: 180,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  dropdownItemText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
});
