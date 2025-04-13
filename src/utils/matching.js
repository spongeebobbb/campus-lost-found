/**
 * Utility functions for matching lost and found items
 */

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Similarity score between 0 and 1
 */
export const stringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Convert to lowercase for better matching
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Calculate Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j++) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  if (maxLength === 0) return 1; // Both strings are empty
  
  // Return similarity score (1 - normalized distance)
  return 1 - distance / maxLength;
};

/**
 * Check if two dates are within a certain range of each other
 * @param {string} date1 - ISO date string
 * @param {string} date2 - ISO date string
 * @param {number} daysRange - Number of days range
 * @returns {boolean}
 */
export const areDatesInRange = (date1, date2, daysRange = 5) => {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Calculate difference in days
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysRange;
};

/**
 * Find potential matches between a lost/found item and a list of items
 * @param {Object} targetItem - The item to match
 * @param {Array} itemsList - List of items to compare against
 * @param {string} targetType - 'lost' or 'found'
 * @returns {Array} Array of potential matches with match scores
 */
export const findPotentialMatches = (targetItem, itemsList, targetType) => {
  if (!targetItem || !itemsList || !itemsList.length) return [];
  
  const compareType = targetType === 'lost' ? 'found' : 'lost';
  const matchScores = [];
  
  for (const item of itemsList) {
    let score = 0;
    let matches = 0;
    
    // Title similarity (weighted heavily)
    const titleSimilarity = stringSimilarity(targetItem.title, item.title);
    score += titleSimilarity * 0.4;
    
    // Category exact match
    if (targetItem.category === item.category) {
      score += 0.2;
      matches++;
    }
    
    // Description similarity
    const descSimilarity = stringSimilarity(targetItem.description, item.description);
    score += descSimilarity * 0.2;
    
    // Location match
    if (targetItem.location === item.location) {
      score += 0.1;
      matches++;
    }
    
    // Date range check
    if (areDatesInRange(targetItem.date, item.date, 7)) {
      score += 0.1;
      matches++;
    }
    
    // Only include if there's some meaningful match
    if (score > 0.25 || matches >= 2) {
      matchScores.push({
        item,
        score,
        matches,
        type: compareType
      });
    }
  }
  
  // Sort by score in descending order
  return matchScores.sort((a, b) => b.score - a.score);
};

/**
 * Get match status text based on match score
 * @param {number} score - Match score between 0 and 1
 * @returns {string} Match status text
 */
export const getMatchStatusText = (score) => {
  if (score >= 0.8) {
    return 'Very High Match';
  } else if (score >= 0.6) {
    return 'High Match';
  } else if (score >= 0.4) {
    return 'Moderate Match';
  } else {
    return 'Possible Match';
  }
};

/**
 * Get match status color based on match score
 * @param {number} score - Match score between 0 and 1
 * @returns {string} CSS color class
 */
export const getMatchStatusColor = (score) => {
  if (score >= 0.8) {
    return 'text-green-600';
  } else if (score >= 0.6) {
    return 'text-green-500';
  } else if (score >= 0.4) {
    return 'text-yellow-500';
  } else {
    return 'text-yellow-600';
  }
};