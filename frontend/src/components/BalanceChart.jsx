import React from 'react';

const BalanceChart = ({ data }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.totalSpent), 100); // Ensure minimum scale
  
  return (
    <div className="balance-chart">
      <div className="chart-bars">
        {data.length > 0 ? (
          data.map((month, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div 
                  className="chart-bar"
                  style={{ 
                    height: `${(month.totalSpent / maxValue) * 100}%`,
                    backgroundColor: `rgba(138, 75, 255, ${0.4 + (month.totalSpent / maxValue) * 0.6})`
                  }}
                >
                  <div className="chart-value">{formatCurrency(month.totalSpent)}</div>
                </div>
              </div>
              <div className="chart-label">{month.month}</div>
            </div>
          ))
        ) : (
          <div className="no-data-message">No spending data available</div>
        )}
      </div>
    </div>
  );
};

export default BalanceChart; 