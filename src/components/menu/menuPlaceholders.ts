// Food placeholder images based on keywords
export const getFoodPlaceholder = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('nasi goreng') || lowerName.includes('fried rice')) {
    return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('nasi') || lowerName.includes('rice')) {
    return 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('mie') || lowerName.includes('noodle') || lowerName.includes('bakmi')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('ayam') || lowerName.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('sate') || lowerName.includes('satay')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('soto') || lowerName.includes('soup') || lowerName.includes('sup')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('rendang') || lowerName.includes('beef') || lowerName.includes('sapi')) {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('seafood') || lowerName.includes('ikan') || lowerName.includes('fish') || lowerName.includes('udang') || lowerName.includes('shrimp')) {
    return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('teh') || lowerName.includes('tea')) {
    return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('kopi') || lowerName.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('jus') || lowerName.includes('juice') || lowerName.includes('smoothie')) {
    return 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('es') || lowerName.includes('ice') || lowerName.includes('minuman')) {
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('dessert') || lowerName.includes('kue') || lowerName.includes('cake')) {
    return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop';
  }
  
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
};
