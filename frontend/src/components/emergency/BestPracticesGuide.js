import React from 'react';
import { FiAlertTriangle, FiCheck, FiClock, FiActivity, FiHeart } from 'react-icons/fi';
import styles from './BestPracticesGuide.module.css';

const BestPracticesGuide = ({ todayStats, userProfile, exceededMacros }) => {
  const { caloriesConsumed = 0, caloriesTarget = 2000 } = todayStats || {};
  const remainingCalories = caloriesTarget - caloriesConsumed;
  
  // Calculate current macro percentages
  const calculateCurrentMacroPercentages = () => {
    // This would come from your analytics data
    const currentProtein = todayStats?.proteinConsumed || 0;
    const currentCarbs = todayStats?.carbsConsumed || 0;
    const currentFats = todayStats?.fatsConsumed || 0;
    
    const totalCalories = caloriesConsumed;
    if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };
    
    return {
      protein: ((currentProtein * 4) / totalCalories) * 100,
      carbs: ((currentCarbs * 4) / totalCalories) * 100,
      fat: ((currentFats * 9) / totalCalories) * 100
    };
  };

  const currentMacros = calculateCurrentMacroPercentages();
  
  // Scientific recommendations based on your documentation
  const getScientificRecommendations = () => {
    const recommendations = [];
    
    // Low Calorie Emergency Detection
    if (remainingCalories < 500) {
      recommendations.push({
        type: 'emergency',
        icon: <FiAlertTriangle />,
        title: 'Low Calorie Emergency Mode',
        description: `Only ${remainingCalories} calories remaining requires specialized strategies.`,
        actions: [
          'Focus on high-satiety, low-calorie foods',
          'Prioritize lean protein sources',
          'Increase non-starchy vegetable intake',
          'Consider light post-meal activity'
        ],
        scientificBasis: 'Colberg et al., 2016 - Post-prandial activity enhances glucose uptake'
      });
    }

    // Protein Analysis
    if (currentMacros.protein < 25) {
      recommendations.push({
        type: 'protein',
        icon: <FiActivity />,
        title: 'Increase Protein Intake',
        description: 'Current protein intake below optimal range for satiety and muscle preservation.',
        actions: [
          'Aim for 20-40g protein per meal',
          'Include lean meats, fish, eggs, or plant proteins',
          'Spread protein evenly across remaining meals'
        ],
        scientificBasis: 'Schoenfeld et al., 2018 - MPS optimizes at 20-40g/meal'
      });
    } else if (currentMacros.protein > 40) {
      recommendations.push({
        type: 'protein',
        icon: <FiCheck />,
        title: 'Protein Well Managed',
        description: 'Current protein intake supports muscle protein synthesis effectively.',
        actions: [
          'Maintain current protein distribution',
          'Ensure adequate hydration',
          'Continue with balanced approach'
        ],
        scientificBasis: 'PMC 5828430 - Optimal protein distribution patterns'
      });
    }

    // Carbohydrate Analysis
    if (currentMacros.carbs > 55) {
      recommendations.push({
        type: 'carbs',
        icon: <FiAlertTriangle />,
        title: 'Reduce Carbohydrate Intake',
        description: 'High carb percentage may impact blood glucose and fat utilization.',
        actions: [
          'Replace high-GI carbs with low-GI alternatives',
          'Increase fiber-rich vegetables',
          'Consider 15-30min post-meal walking',
          'Focus on complex carbohydrates'
        ],
        scientificBasis: 'Colberg et al., 2016 - Low-GI carbs reduce glucose spikes'
      });
    }

    // Fat Analysis
    if (currentMacros.fat > 35) {
      recommendations.push({
        type: 'fat',
        icon: <FiHeart />,
        title: 'Optimize Fat Sources',
        description: 'High fat percentage, focus on quality over quantity.',
        actions: [
          'Replace saturated fats with unsaturated',
          'Include omega-3 rich foods',
          'Monitor portion sizes of high-fat foods',
          'Increase vegetable intake'
        ],
        scientificBasis: 'WHO 2023 - Unsaturated fats reduce CVD risk'
      });
    }

    // General Emergency Strategies
    recommendations.push({
      type: 'general',
      icon: <FiClock />,
      title: 'Emergency Recovery Protocol',
      description: 'Multi-day correction strategy for optimal results.',
      actions: [
        'Spread calorie adjustments over 2-4 days',
        'Incorporate daily light activity (walking)',
        'Prioritize protein at 20-40g per meal',
        'Use low-GI carbohydrates strategically',
        'Maintain hydration and fiber intake'
      ],
      scientificBasis: 'PMC 2023 - Multi-day spreading prevents rebound overeating'
    });

    return recommendations;
  };

  const recommendations = getScientificRecommendations();

  // Calculate ideal emergency macro distribution
  const getEmergencyMacroTargets = () => ({
    protein: { min: 50, max: 60 }, // Very high protein
    carbs: { min: 20, max: 30 },   // Low carbs
    fat: { min: 10, max: 20 }      // Low fat
  });

  const emergencyTargets = getEmergencyMacroTargets();

  return (
    <div className={styles.bestPracticesContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FiAlertTriangle />
          Scientific Emergency Guidance
        </h2>
        <p className={styles.subtitle}>
          Evidence-based strategies for your low-calorie situation
        </p>
      </div>

      {/* Current Status Overview */}
      <div className={styles.statusOverview}>
        <div className={styles.statusCard}>
          <div className={styles.statusLabel}>Remaining Calories</div>
          <div className={styles.statusValue}>{remainingCalories}</div>
          <div className={styles.statusUnit}>kcal</div>
        </div>
        <div className={styles.statusCard}>
          <div className={styles.statusLabel}>Emergency Level</div>
          <div className={styles.statusValue}>
            {remainingCalories < 300 ? 'High' : remainingCalories < 500 ? 'Moderate' : 'Low'}
          </div>
          <div className={styles.statusUnit}>Priority</div>
        </div>
      </div>

      {/* Emergency Macro Targets */}
      <div className={styles.macroTargets}>
        <h3 className={styles.sectionTitle}>Emergency Macro Targets</h3>
        <div className={styles.macroGrid}>
          <div className={styles.macroTarget}>
            <div className={styles.macroHeader}>
              <span className={styles.macroName}>Protein</span>
              <span className={styles.macroRange}>
                {emergencyTargets.protein.min}-{emergencyTargets.protein.max}%
              </span>
            </div>
            <div className={styles.macroBar}>
              <div 
                className={`${styles.macroFill} ${styles.protein}`}
                style={{ width: `${Math.min(100, (currentMacros.protein / emergencyTargets.protein.max) * 100)}%` }}
              ></div>
            </div>
            <div className={styles.macroCurrent}>
              Current: {currentMacros.protein.toFixed(1)}%
            </div>
          </div>

          <div className={styles.macroTarget}>
            <div className={styles.macroHeader}>
              <span className={styles.macroName}>Carbs</span>
              <span className={styles.macroRange}>
                {emergencyTargets.carbs.min}-{emergencyTargets.carbs.max}%
              </span>
            </div>
            <div className={styles.macroBar}>
              <div 
                className={`${styles.macroFill} ${styles.carbs}`}
                style={{ width: `${Math.min(100, (currentMacros.carbs / emergencyTargets.carbs.max) * 100)}%` }}
              ></div>
            </div>
            <div className={styles.macroCurrent}>
              Current: {currentMacros.carbs.toFixed(1)}%
            </div>
          </div>

          <div className={styles.macroTarget}>
            <div className={styles.macroHeader}>
              <span className={styles.macroName}>Fat</span>
              <span className={styles.macroRange}>
                {emergencyTargets.fat.min}-{emergencyTargets.fat.max}%
              </span>
            </div>
            <div className={styles.macroBar}>
              <div 
                className={`${styles.macroFill} ${styles.fat}`}
                style={{ width: `${Math.min(100, (currentMacros.fat / emergencyTargets.fat.max) * 100)}%` }}
              ></div>
            </div>
            <div className={styles.macroCurrent}>
              Current: {currentMacros.fat.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Recommendations */}
      <div className={styles.recommendations}>
        <h3 className={styles.sectionTitle}>Evidence-Based Recommendations</h3>
        <div className={styles.recommendationsGrid}>
          {recommendations.map((rec, index) => (
            <div key={index} className={`${styles.recommendationCard} ${styles[rec.type]}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>{rec.icon}</div>
                <h4 className={styles.cardTitle}>{rec.title}</h4>
              </div>
              
              <p className={styles.cardDescription}>{rec.description}</p>
              
              <div className={styles.actionsList}>
                <h5 className={styles.actionsTitle}>Recommended Actions:</h5>
                <ul className={styles.actions}>
                  {rec.actions.map((action, actionIndex) => (
                    <li key={actionIndex} className={styles.actionItem}>
                      <FiCheck className={styles.actionIcon} />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={styles.scientificBasis}>
                <strong>Scientific Basis:</strong> {rec.scientificBasis}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Recovery Protocol */}
      <div className={styles.recoveryProtocol}>
        <h3 className={styles.sectionTitle}>24-Hour Recovery Protocol</h3>
        <div className={styles.protocolSteps}>
          <div className={styles.protocolStep}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Immediate (Next 4 hours)</h4>
              <p>15-30 minute brisk walk + high-protein, low-carb meal</p>
            </div>
          </div>
          
          <div className={styles.protocolStep}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Medium-term (Next 24 hours)</h4>
              <p>Spread calorie adjustment over 2-4 meals, maintain protein at 20-40g/meal</p>
            </div>
          </div>
          
          <div className={styles.protocolStep}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Long-term (2-4 days)</h4>
              <p>Gradual return to normal macro distribution, monitor energy levels</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestPracticesGuide;