// RiskAnalysis.jsx - Fixed with Pinecone References and Better Error Handling
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
  const [debugInfo, setDebugInfo] = useState('');

  const runAnalysis = async () => {
    if (!documentInfo?.document_id) {
      setError('No document ID available for analysis.');
      return;
    }
    
    setLoading(true);
    setError('');
    setDebugInfo('Analyzing contract with enhanced Pinecone backend...');
    
    try {
      console.log('🎯 Starting enhanced risk analysis for:', documentInfo.document_id);
      const response = await runRiskAnalysis(documentInfo.document_id);
      
      if (response.success) {
        console.log('✅ Risk analysis successful:', response.data);
        setAnalysis(response.data);
        setDebugInfo(`Analysis completed: ${response.data.relevant_chunks?.length || 0} chunks analyzed with Pinecone Enhanced`);
      } else {
        console.error('❌ Risk analysis failed:', response.error);
        setError(response.error || 'Risk analysis failed');
        setDebugInfo('Analysis failed - check document content and backend logs');
      }
    } catch (err) {
      console.error('❌ Risk analysis error:', err);
      setError('Analysis failed. Please try again.');
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis when component mounts
  useEffect(() => {
    if (documentInfo?.document_id && !analysis && !loading) {
      runAnalysis();
    }
  }, [documentInfo?.document_id]);

  // Enhanced chart data preparation
  const getRiskDistributionData = () => {
    if (!analysis?.analysis?.risks) return [];
    
    const riskCounts = { High: 0, Medium: 0, Low: 0 };
    analysis.analysis.risks.forEach(risk => {
      const severity = risk.severity || 'Medium';
      riskCounts[severity] = (riskCounts[severity] || 0) + 1;
    });
    
    return [
      { name: 'High Risk', value: riskCounts.High, color: '#ef4444', fill: '#ef4444' },
      { name: 'Medium Risk', value: riskCounts.Medium, color: '#f59e0b', fill: '#f59e0b' },
      { name: 'Low Risk', value: riskCounts.Low, color: '#10b981', fill: '#10b981' }
    ].filter(item => item.value > 0);
  };

  const getRiskScoreData = () => {
    const score = analysis?.analysis?.risk_score || 5;
    return [
      { 
        name: 'Risk Score', 
        value: score,
        fill: score > 7 ? '#ef4444' : score > 4 ? '#f59e0b' : '#10b981'
      }
    ];
  };

  const getSeverityEmoji = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚠️';
    }
  };

  // Enhanced chart components
  const CustomPieChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={40}
          dataKey="value"
          stroke="#1e293b"
          strokeWidth={3}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#f1f5f9'
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#f1f5f9' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const CustomRadialChart = ({ data }) => (
    <ResponsiveContainer width="100%" height={300}>
      <RadialBarChart 
        cx="50%" 
        cy="50%" 
        innerRadius="60%" 
        outerRadius="90%" 
        data={data}
      >
        <RadialBar 
          dataKey="value" 
          cornerRadius={10} 
          fill={data[0]?.fill || '#6366f1'}
        />
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="#f1f5f9"
          fontSize="28"
          fontWeight="bold"
        >
          {data[0]?.value || 0}/10
        </text>
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#f1f5f9'
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="risk-analysis-page">
      <div className="page-header">
        <h2>🎯 Legal Risk Analysis</h2>
        <p>Enhanced analysis powered by Pinecone vector search</p>
        
        <button 
          onClick={runAnalysis}
          disabled={loading || !documentInfo?.document_id}
          className="analyze-btn"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing Risks with Pinecone...
            </>
          ) : (
            <>
              <span>🔍</span>
              {analysis ? 'Refresh Analysis' : 'Analyze Document Risks'}
            </>
          )}
        </button>
      </div>

      {debugInfo && (
        <div className="debug-info">
          <small>Status: {debugInfo}</small>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Analysis Failed:</strong>
            <p>{error}</p>
            <small>Ensure your document was uploaded successfully and the Pinecone backend is running.</small>
          </div>
        </div>
      )}

      {analysis && analysis.analysis && (
        <div className="risk-results">
          {/* Enhanced metrics dashboard */}
          <div className="metrics-dashboard">
            <div className="metric-card total">
              <div className="metric-icon">📊</div>
              <div className="metric-value">{analysis.analysis.total_risks || analysis.analysis.risks?.length || 0}</div>
              <div className="metric-label">Total Risks Found</div>
            </div>
            <div className="metric-card score">
              <div className="metric-icon">🎯</div>
              <div className="metric-value">{analysis.analysis.risk_score || 0}</div>
              <div className="metric-label">Risk Score</div>
            </div>
            <div className="metric-card status">
              <div className="metric-icon">
                {(analysis.analysis.risk_score || 0) > 7 ? '🔴' : 
                 (analysis.analysis.risk_score || 0) > 4 ? '🟡' : '🟢'}
              </div>
              <div className="metric-value">
                {(analysis.analysis.risk_score || 0) > 7 ? 'High' : 
                 (analysis.analysis.risk_score || 0) > 4 ? 'Medium' : 'Low'}
              </div>
              <div className="metric-label">Risk Level</div>
            </div>
            <div className="metric-card chunks">
              <div className="metric-icon">🧩</div>
              <div className="metric-value">{analysis.relevant_chunks?.length || 0}</div>
              <div className="metric-label">Chunks Analyzed</div>
            </div>
          </div>

          {/* Enhanced charts section */}
          {analysis.analysis.risks && analysis.analysis.risks.length > 0 && (
            <div className="charts-section">
              <div className="chart-container gradient-border">
                <h3>📊 Risk Distribution</h3>
                <CustomPieChart data={getRiskDistributionData()} />
              </div>

              <div className="chart-container gradient-border">
                <h3>🎯 Overall Risk Score</h3>
                <CustomRadialChart data={getRiskScoreData()} />
              </div>
            </div>
          )}

          {/* Enhanced risk list - clean and focused */}
          <div className="risks-section">
            <h3>🔍 Identified Risks ({analysis.analysis.risks?.length || 0} found)</h3>
            
            {analysis.analysis.risks && analysis.analysis.risks.length > 0 ? (
              <div className="risks-grid">
                {analysis.analysis.risks.map((risk, index) => (
                  <div key={index} className={`risk-card-enhanced ${risk.severity?.toLowerCase()}`}>
                    <div className="risk-header-enhanced">
                      <span className="risk-emoji-enhanced">{getSeverityEmoji(risk.severity)}</span>
                      <div className="risk-info-enhanced">
                        <h4 className="risk-title-enhanced">{risk.title}</h4>
                        <span className={`severity-badge-enhanced ${risk.severity?.toLowerCase()}`}>
                          {risk.severity} Risk
                        </span>
                      </div>
                    </div>
                    
                    <div className="risk-description-enhanced">
                      <p>{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-risks-enhanced">
                <div className="no-risks-icon">✅</div>
                <h4>Low Risk Contract</h4>
                <p>The analysis indicates this contract has minimal risk factors. Standard terms and conditions appear to be in place.</p>
              </div>
            )}
          </div>

          {/* Backend info */}
          <div className="backend-info">
            <h4>🔧 Analysis Details</h4>
            <div className="backend-stats">
              <span>Powered by: Pinecone Enhanced Vector Search</span>
              <span>•</span>
              <span>Chunks: {analysis.relevant_chunks?.length || 0}</span>
              <span>•</span>
              <span>Embedding Model: all-MiniLM-L6-v2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
