// RiskAnalysis.jsx - Risk Analysis with Beautiful Charts
import React, { useState, useEffect } from 'react';
import { runRiskAnalysis } from '../services/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const RiskAnalysis = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    if (!documentInfo?.document_id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await runRiskAnalysis(documentInfo.document_id);
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Chart data preparation
  const getRiskDistributionData = () => {
    if (!analysis?.analysis?.risk_metrics) return [];
    
    const metrics = analysis.analysis.risk_metrics;
    return [
      { name: 'High Risk', value: metrics.high_risk_count || 0, color: '#ef4444' },
      { name: 'Medium Risk', value: metrics.medium_risk_count || 0, color: '#f59e0b' },
      { name: 'Low Risk', value: metrics.low_risk_count || 0, color: '#10b981' }
    ];
  };

  const getRiskCategoriesData = () => {
    if (!analysis?.analysis?.risk_metrics?.risk_categories) return [];
    
    return analysis.analysis.risk_metrics.risk_categories.map(category => ({
      category,
      count: analysis.analysis.risks?.filter(risk => 
        risk.title.toLowerCase().includes(category.toLowerCase())
      ).length || 1
    }));
  };

  const getOverallRiskData = () => {
    const score = analysis?.analysis?.risk_metrics?.overall_risk_score || 0;
    return [
      { name: 'Risk Score', value: score, fill: score > 7 ? '#ef4444' : score > 4 ? '#f59e0b' : '#10b981' }
    ];
  };

  return (
    <div className="risk-analysis-page">
      <div className="page-header">
        <h2>🎯 Legal Risk Analysis</h2>
        <p>Comprehensive risk assessment with visual insights</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="analyze-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing Risks...
            </>
          ) : (
            <>
              <span>🔍</span>
              Analyze Document Risks
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {analysis && (
        <div className="risk-results">
          {/* ✅ RISK METRICS DASHBOARD */}
          <div className="metrics-dashboard">
            <div className="metric-card">
              <div className="metric-value">{analysis.analysis.risk_metrics?.total_risks || 0}</div>
              <div className="metric-label">Total Risks</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{analysis.analysis.risk_metrics?.overall_risk_score || 0}</div>
              <div className="metric-label">Risk Score</div>
            </div>
            <div className="metric-card high">
              <div className="metric-value">{analysis.analysis.risk_metrics?.high_risk_count || 0}</div>
              <div className="metric-label">High Risks</div>
            </div>
          </div>

          {/* ✅ CHARTS SECTION */}
          <div className="charts-section">
            {/* Risk Distribution Pie Chart */}
            <div className="chart-container">
              <h3>📊 Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getRiskDistributionData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getRiskDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Categories Bar Chart */}
            <div className="chart-container">
              <h3>📈 Risk Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRiskCategoriesData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Overall Risk Score Gauge */}
            <div className="chart-container">
              <h3>🎯 Overall Risk Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="90%" 
                  data={getOverallRiskData()}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="score-text"
                  >
                    {analysis.analysis.risk_metrics?.overall_risk_score || 0}/10
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ✅ RISKS LIST */}
          <div className="risks-section">
            <h3>🔍 Detailed Risk Analysis ({analysis.analysis.risks?.length || 0} risks found)</h3>
            
            {analysis.analysis.risks?.map((risk, index) => (
              <div key={index} className={`risk-card ${risk.severity?.toLowerCase()}`}>
                <div className="risk-header">
                  <span className="risk-emoji">{risk.emoji}</span>
                  <h4 className="risk-title">{risk.title}</h4>
                  <span className={`severity-badge ${risk.severity?.toLowerCase()}`}>
                    {risk.severity}
                  </span>
                </div>
                
                <div className="risk-details">
                  <div className="risk-detail">
                    <strong>📝 Description:</strong>
                    <p>{risk.description}</p>
                  </div>
                  
                  {risk.clause_reference && (
                    <div className="risk-detail">
                      <strong>📄 Clause Reference:</strong>
                      <p>{risk.clause_reference}</p>
                    </div>
                  )}
                  
                  <div className="risk-detail">
                    <strong>💡 Recommendation:</strong>
                    <p>{risk.recommendation}</p>
                  </div>
                  
                  {risk.impact && (
                    <div className="risk-detail">
                      <strong>⚡ Potential Impact:</strong>
                      <p>{risk.impact}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          {analysis.analysis.summary && (
            <div className="executive-summary">
              <h3>📋 Executive Summary</h3>
              <p>{analysis.analysis.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
