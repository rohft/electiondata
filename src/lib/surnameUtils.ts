// Surname extraction utilities (caste detection disabled)

export const extractSurname = (fullName: string): {surname: string;} => {
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 0) return { surname: '' };

  // Get the last word as potential surname
  const lastName = nameParts[nameParts.length - 1];

  // Check for compound surnames in parentheses
  const parenMatch = fullName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return {
      surname: parenMatch[1]
    };
  }

  // Default to last name
  return {
    surname: lastName
  };
};

export const AGE_RANGES = [
{ label: 'All Ages', value: 'all', min: 0, max: 200 },
{ label: '18-25', value: '18-25', min: 18, max: 25 },
{ label: '26-35', value: '26-35', min: 26, max: 35 },
{ label: '36-45', value: '36-45', min: 36, max: 45 },
{ label: '46-55', value: '46-55', min: 46, max: 55 },
{ label: '56-65', value: '56-65', min: 56, max: 65 },
{ label: '65+', value: '65+', min: 65, max: 200 }];