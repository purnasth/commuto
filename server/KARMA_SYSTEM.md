# Enhanced Distance-Based Karma Calculation System

## Overview

This document describes the implementation of the **Tiered Linear Scaling with Sentiment Weighting** algorithm for calculating karma points for riders and credit scores for passengers in the commute helper application.

## Algorithm: Tiered Linear Scaling with Sentiment Weighting

### What is it?

**Tiered Linear Scaling with Sentiment Weighting** is a mathematical approach to fair resource allocation that combines distance-based tiered scaling with quality-based weighting factors. The algorithm ensures proportional reward distribution while maintaining system stability through bounded outputs.

### Mathematical Definition

```
P = min(max((B × D_m) + S_b, F_min), F_max)
```

Where:

- **P** = Final points awarded
- **B** = Base points (participation reward) = 15
- **D_m** = Distance multiplier (tier-based scaling factor)
- **S_b** = Sentiment bonus (quality weighting)
- **F_min** = Minimum floor (system stability) = 5
- **F_max** = Maximum cap (exploitation prevention) = 100

### Algorithm Specifications

1. **Tiered Distance Scaling**: Linear scaling factors based on distance ranges
2. **Sentiment Weighting**: Quality-based bonus application
3. **Bounded Output**: Min/max constraints for system integrity
4. **Proportional Fairness**: Reward proportional to contribution

## Distance Tiers & Multipliers

| Tier          | Distance Range | Multiplier | Description                          |
| ------------- | -------------- | ---------- | ------------------------------------ |
| **SHORT**     | 0-2 km         | 1.0x       | Local trips, minimal impact          |
| **MEDIUM**    | 2-5 km         | 1.5x       | Moderate distance, good contribution |
| **LONG**      | 5-10 km        | 2.0x       | Significant travel, high impact      |
| **VERY_LONG** | 10+ km         | 2.5x       | Major commutes, maximum contribution |

## Sentiment-Based Bonuses

| Emoji | Description  | Bonus Points | Impact                  |
| ----- | ------------ | ------------ | ----------------------- |
| 😊    | Satisfied    | +5           | Good service quality    |
| 😐    | Neutral      | +2           | Average service quality |
| 😠    | Dissatisfied | +0           | Poor service quality    |

## Calculation Examples

### Example 1: Short Ride with Happy Feedback

- **Distance**: 1.2 km (SHORT tier)
- **Feedback**: 😊 Satisfied
- **Calculation**: (15 × 1.0) + 5 = 20 points

### Example 2: Medium Ride with Neutral Feedback

- **Distance**: 3.5 km (MEDIUM tier)
- **Feedback**: 😐 Neutral
- **Calculation**: (15 × 1.5) + 2 = 24 points

### Example 3: Long Ride with Happy Feedback

- **Distance**: 7.8 km (LONG tier)
- **Feedback**: 😊 Satisfied
- **Calculation**: (15 × 2.0) + 5 = 35 points

### Example 4: Very Long Ride with Dissatisfied Feedback

- **Distance**: 15 km (VERY_LONG tier)
- **Feedback**: 😠 Dissatisfied
- **Calculation**: (15 × 2.5) + 0 = 37.5 → 38 points

## Implementation Details

### Files Structure

```
src/
├── constants/
│   └── karma-config.ts          # Distance tiers, multipliers, and point configs
├── services/
│   └── karma-calculation.service.ts  # Centralized calculation logic
└── ride.controller.ts           # Updated feedback submission endpoint
```

### Key Components

#### 1. Configuration (`karma-config.ts`)

- Defines distance tiers and thresholds
- Sets multipliers for each tier
- Configures sentiment bonuses and point caps

#### 2. Calculation Service (`karma-calculation.service.ts`)

- Implements the core algorithm logic
- Provides detailed calculation breakdown
- Handles edge cases (null distance, invalid feedback)

#### 3. Updated Controller (`ride.controller.ts`)

- Integrates the new calculation service
- Enhanced logging with full calculation details
- Returns comprehensive karma information in API responses

### API Response Enhancement

The feedback submission endpoint now returns detailed karma calculation information:

```json
{
  "message": "Feedback submitted successfully",
  "pointsAwarded": 32,
  "karmaCalculation": {
    "algorithm": "Tiered Linear Scaling with Sentiment Weighting",
    "distance": 3.5,
    "distanceTier": "medium",
    "distanceTierDescription": "2-5 km (1.5x multiplier)",
    "basePoints": 15,
    "distanceMultiplier": 1.5,
    "sentimentBonus": 10,
    "totalPoints": 32,
    "formula": "Points = min(max((15 × 1.5) + 10, 5), 150) = 32",
    "breakdown": {
      "step1_base": 15,
      "step2_afterDistance": 23,
      "step3_afterSentiment": 33,
      "step4_final": 32
    }
  }
}
```

### Logging Enhancements

The system now provides comprehensive logging for all karma calculations:

```typescript
this.logger.log({
  level: 'info',
  message:
    'Karma calculation completed using Tiered Linear Scaling with Sentiment Weighting algorithm',
  tag: 'feedback',
  algorithm: 'Tiered Linear Scaling with Sentiment Weighting',
  calculation: {
    distance: 3.5,
    emoji: 0,
    emojiDescription: '😊 Satisfied',
    distanceTier: 'medium',
    distanceTierDesc: '2-5 km (1.5x multiplier)',
    basePoints: 15,
    distanceMultiplier: 1.5,
    sentimentBonus: 10,
    totalPoints: 32,
    formula: 'Points = min(max((15 × 1.5) + 10, 5), 150) = 32',
    breakdown: {
      /* detailed steps */
    },
  },
});
```

## Benefits of the New System

1. **Fairness**: Users are rewarded proportionally to their contribution
2. **Prevents Exploitation**: Eliminates unfair advantage of multiple short rides
3. **Quality Incentive**: Encourages good service through sentiment weighting
4. **Transparency**: Full calculation breakdown available in logs and API responses
5. **Flexibility**: Easy to adjust tiers, multipliers, and bonuses via configuration
6. **Scalability**: Handles edge cases and can accommodate future enhancements

## Backward Compatibility

- The system automatically calculates distance for existing rides without stored distance
- Maintains existing karma transaction logging format with enhanced details
- API responses include both legacy `pointsAwarded` and new `karmaCalculation` objects

## Future Enhancements

Potential improvements to consider:

1. **Dynamic Multipliers**: Adjust based on time of day, traffic conditions
2. **Streak Bonuses**: Additional points for consecutive quality rides
3. **Seasonal Adjustments**: Higher multipliers during peak commute seasons
4. **Geographic Factors**: Different multipliers for urban vs. suburban areas
5. **Environmental Bonuses**: Extra points for eco-friendly routes

## Configuration

The system is highly configurable through `karma-config.ts`:

```typescript
export const KARMA_POINTS = {
  BASE_POINTS: 15,
  SENTIMENT_BONUS: {
    [0]: 5, // Satisfied
    [1]: 2, // Neutral
    [2]: 0, // Dissatisfied
  },
  MAX_POINTS_CAP: 100,
  MIN_POINTS_FLOOR: 5,
} as const;
```

This allows for easy adjustment of the point system without code changes to the core algorithm.
