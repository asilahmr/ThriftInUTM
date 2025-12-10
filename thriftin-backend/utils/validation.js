// utils/validation.js

const validateProductData = (data) => {
  const errors = [];
  const { name, category, description, price, condition } = data;

  // Validate name
  if (!name || name.trim().length === 0) {
    errors.push('Product name is required');
  } else if (name.length > 150) {
    errors.push('Product name must not exceed 150 characters');
  }

  // Validate category
  const validCategories = ['Books', 'Electronics', 'Fashion', 'Furniture', 'Others'];
  if (!category || !validCategories.includes(category)) {
    errors.push('Valid category is required (Books, Electronics, Fashion, Furniture, Others)');
  }

  // Validate description
  if (!description || description.trim().length === 0) {
    errors.push('Product description is required');
  } else if (description.length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  // Validate price
  const priceNum = parseFloat(price);
  if (!price || isNaN(priceNum)) {
    errors.push('Valid price is required');
  } else if (priceNum <= 0) {
    errors.push('Price must be greater than 0');
  } else if (priceNum > 99999999.99) {
    errors.push('Price is too high');
  }

  // Validate condition
  const validConditions = ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'];
  if (!condition || !validConditions.includes(condition)) {
    errors.push('Valid condition is required (Like New, Excellent, Good, Fair, Poor)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateImages = (files) => {
  const errors = [];

  if (!files || files.length === 0) {
    errors.push('At least one product image is required');
    return { isValid: false, errors };
  }

  const maxFiles = 5;
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} images allowed`);
  }

  files.forEach((file, index) => {
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Image ${index + 1}: Only JPEG, JPG, PNG, and WebP formats are allowed`);
    }
    if (file.size > maxSize) {
      errors.push(`Image ${index + 1}: File size must not exceed 5MB`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateProductData,
  validateImages
};