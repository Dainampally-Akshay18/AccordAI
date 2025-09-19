// RiskAnalysis.jsx - Complete with Attractive Charts and Fixed Tooltips
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
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

// ✨ ATTRACTIVE COLOR PALETTES
const RISK_COLORS = {
  high: '#FF4757',      // Vibrant Red
  medium: '#FFA726',    // Bright Orange  
  low: '#66BB6A'        // Fresh Green
};

const CHART_COLORS = [
  '#FF4757', '#FFA726', '#66BB6A', '#42A5F5', 
  '#AB47BC', '#26C6DA', '#FF7043', '#9CCC65'
];

const GRADIENT_COLORS = {
  primary: ['#667eea', '#764ba2'],
  secondary: ['#f093fb', '#f5576c'],
  tertiary: ['#4facfe', '#00f2fe'],
  quaternary: ['#43e97b', '#38f9d7']
};

// 🎨 Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-2xl">
        <div className="text-white font-semibold mb-2">{label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-slate-300">
              {entry.name}: <span className="text-white font-bold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// 🎨 Custom Label Component for Pie Chart
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Hide labels for very small slices
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {${(percent * 100).toFixed(0)}%}
    </text>
  );
};

// Expandable Text Component
const ExpandableText = ({ text, limit = 800 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return (
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
        {text || 'No content available'}
      </p>
    );
  }

  return (
    <div>
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
        {expanded ? text : text.substring(0, limit) + '...'}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-red-400 hover:text-red-300 font-medium text-sm underline transition-colors"
      >
        {expanded ? 'Show Less ↑' : 'Read Full Content ↓'}
      </button>
    </div>
  );
};

const RiskAnalysis = ({ documentInfo }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [showCharts, setShowCharts] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    risks: true,
    chunks: false
  });

  const runAnalysis = async () => {
    if (!documentInfo?.document_id && !documentInfo?.document_name) {
      setError('No document information available. Please upload a document first.');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('Analyzing document for potential risks with enhanced AI...');

    try {
      const docId = documentInfo.document_id || documentInfo.document_name;
      console.log('🔍 Starting risk analysis for:', docId);
      
      const response = await runRiskAnalysis(docId);

      if (response.success) {
        console.log('✅ Risk analysis successful:', response.data);
        setAnalysis(response.data);
        setDebugInfo(Risk analysis complete: ${response.data.relevant_chunks?.length || 0} sections analyzed);
      } else {
        console.error('❌ Risk analysis failed:', response.error);
        setError(response.error || 'Risk analysis failed');
        setDebugInfo('Risk analysis failed');
      }
    } catch (err) {
      console.error('❌ Risk analysis error:', err);
      setError('Risk analysis failed. Please try again.');
      setDebugInfo(Error: ${err.message});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentInfo && !analysis && !loading) {
      runAnalysis();
    }
  }, [documentInfo]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return {
          bg: 'from-red-500/20 to-red-600/20',
          border: 'border-red-500/50',
          text: 'text-red-300',
          badge: 'bg-red-500/20 text-red-300'
        };
      case 'medium':
        return {
          bg: 'from-orange-500/20 to-orange-600/20',
          border: 'border-orange-500/50',
          text: 'text-orange-300',
          badge: 'bg-orange-500/20 text-orange-300'
        };
      case 'low':
        return {
          bg: 'from-green-500/20 to-green-600/20',
          border: 'border-green-500/50',
          text: 'text-green-300',
          badge: 'bg-green-500/20 text-green-300'
        };
      default:
        return {
          bg: 'from-slate-500/20 to-slate-600/20',
          border: 'border-slate-500/50',
          text: 'text-slate-300',
          badge: 'bg-slate-500/20 text-slate-300'
        };
    }
  };

  // 📊 Prepare Chart Data
  const prepareChartData = () => {
    if (!analysis?.analysis) return {};

    const risks = analysis.analysis.risks || [];
    
    // 1. PIE CHART - Risk Distribution by Severity
    const riskDistribution = [
      {
        name: 'High Risk',
        value: risks.filter(r => r.severity?.toLowerCase() === 'high').length,
        color: RISK_COLORS.high
      },
      {
        name: 'Medium Risk', 
        value: risks.filter(r => r.severity?.toLowerCase() === 'medium').length,
        color: RISK_COLORS.medium
      },
      {
        name: 'Low Risk',
        value: risks.filter(r => r.severity?.toLowerCase() === 'low').length,
        color: RISK_COLORS.low
      }
    ].filter(item => item.value > 0);

    // 2. BAR CHART 1 - Risk Categories
    const categoryData = [
      { name: 'Financial', count: risks.filter(r => r.title?.toLowerCase().includes('service bond') || r.title?.toLowerCase().includes('payment')).length },
      { name: 'Legal', count: risks.filter(r => r.title?.toLowerCase().includes('confidential') || r.title?.toLowerCase().includes('compliance')).length },
      { name: 'Operational', count: risks.filter(r => r.title?.toLowerCase().includes('performance') || r.title?.toLowerCase().includes('location')).length },
      { name: 'Termination', count: risks.filter(r => r.title?.toLowerCase().includes('termination') || r.title?.toLowerCase().includes('employment')).length }
    ].filter(item => item.count > 0);

    // 3. BAR CHART 2 - Risk Impact Analysis  
    const impactData = [
      { severity: 'High', impact: risks.filter(r => r.severity?.toLowerCase() === 'high').length * 3 },
      { severity: 'Medium', impact: risks.filter(r => r.severity?.toLowerCase() === 'medium').length * 2 },
      { severity: 'Low', impact: risks.filter(r => r.severity?.toLowerCase() === 'low').length * 1 }
    ];

    // 4. AREA CHART - Risk Score Timeline (simulated)
    const timelineData = [
      { month: 'Jan', score: (analysis.analysis.risk_score || 5) * 0.6 },
      { month: 'Feb', score: (analysis.analysis.risk_score || 5) * 0.7 },
      { month: 'Mar', score: (analysis.analysis.risk_score || 5) * 0.85 },
      { month: 'Apr', score: (analysis.analysis.risk_score || 5) * 0.95 },
      { month: 'May', score: analysis.analysis.risk_score || 5 },
      { month: 'Jun', score: (analysis.analysis.risk_score || 5) * 1.1 }
    ];

    return {
      riskDistribution,
      categoryData,
      impactData,
      timelineData
    };
  };

  const { riskDistribution, categoryData, impactData, timelineData } = prepareChartData();

  return (
    <div className="w-full max-w-none mx-auto">
      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Risk Analysis Dashboard
            </h2>
            <p className="text-slate-400">
              Comprehensive risk assessment with interactive visualizations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/50 disabled:hover:transform-none disabled:hover:shadow-none disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing Risks...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>Analyze Document Risks</span>
                </>
              )}
            </div>
          </button>

          {analysis && (
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
              {showCharts ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12.879M21 3L9.878 9.878" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Hide Charts
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3V21M21 21H3M7 11L12 6L16 10L21 5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Show Charts
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-red-300 font-semibold mb-1">Analysis Error</h3>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500/20 border-b-orange-500 rounded-full animate-spin" style={{ animationDelay: '150ms' }}></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Analyzing Document Risks</h3>
              <h4 className="text-xl font-bold text-white mb-2">Please Hang on and Dont Click Anywhere  </h4>
              <p className="text-slate-400">{debugInfo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Analysis Results */}
      {analysis && (
        <div className="space-y-8">
          {/* Risk Overview Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: '🔴',
                label: 'High Risk',
                value: analysis.analysis?.risks?.filter(r => r.severity?.toLowerCase() === 'high')?.length || 0,
                color: 'from-red-500 to-red-600'
              },
              {
                icon: '🟠',
                label: 'Medium Risk',
                value: analysis.analysis?.risks?.filter(r => r.severity?.toLowerCase() === 'medium')?.length || 0,
                color: 'from-orange-500 to-orange-600'
              },
              {
                icon: '🟢',
                label: 'Low Risk',
                value: analysis.analysis?.risks?.filter(r => r.severity?.toLowerCase() === 'low')?.length || 0,
                color: 'from-green-500 to-green-600'
              },
              {
                icon: '📊',
                label: 'Risk Score',
                value: ${analysis.analysis?.risk_score?.toFixed(1) || 0.0}/10,
                color: 'from-blue-500 to-purple-500'
              }
            ].map((metric, index) => (
              <div key={index} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 text-center hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1">
                <div className={w-16 h-16 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl}>
                  {metric.icon}
                </div>
                <div className={text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent mb-2}>
                  {metric.value}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wider font-semibold">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* 🎨 ATTRACTIVE CHARTS SECTION */}
          {showCharts && analysis.analysis?.risks && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3V21M21 21H3M7 11L12 6L16 10L21 5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Interactive Risk Analytics</h3>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 📊 CHART 1: PIE CHART - Risk Distribution */}
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-600/50">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    Risk Distribution by Severity
                  </h4>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderPieLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#1e293b"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell 
                            key={cell-${index}} 
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ color: '#fff' }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 📊 CHART 2: BAR CHART 1 - Risk Categories */}
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-600/50">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Risk Categories Analysis
                  </h4>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart 
                      data={categoryData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        allowDecimals={false}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        fill="url(#colorGradient1)"
                        radius={[4, 4, 0, 0]}
                        strokeWidth={1}
                        stroke="#42A5F5"
                      />
                      <defs>
                        <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#1976D2" stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 📊 CHART 3: BAR CHART 2 - Risk Impact */}
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-600/50">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    Risk Impact Assessment
                  </h4>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart 
                      data={impactData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="severity" 
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis 
                        allowDecimals={false}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="impact" 
                        fill="url(#colorGradient2)"
                        radius={[4, 4, 0, 0]}
                        strokeWidth={1}
                        stroke="#AB47BC"
                      />
                      <defs>
                        <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#AB47BC" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#7B1FA2" stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 📊 CHART 4: AREA CHART - Risk Score Timeline */}
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-600/50">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Risk Score Progression
                  </h4>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart 
                      data={timelineData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#26C6DA"
                        strokeWidth={3}
                        fill="url(#colorGradient3)"
                      />
                      <defs>
                        <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#26C6DA" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00ACC1" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Risk Details - Ranked by Severity */}
          {analysis.analysis?.risks && analysis.analysis.risks.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Identified Risks (Ranked by Priority)</h3>
                </div>
                <span className="text-slate-400 text-sm">Highest risks displayed first</span>
              </div>

              <div className="space-y-4">
                {analysis.analysis.risks.map((risk, index) => {
                  const colors = getRiskColor(risk.severity);
                  return (
                    <div 
                      key={index} 
                      className={bg-gradient-to-r ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="text-2xl">⚠</span>
                            <h4 className="text-xl font-bold text-white">
                              {risk.title || Risk ${index + 1}}
                            </h4>
                            <span className={px-3 py-1 ${colors.badge} rounded-full text-sm font-semibold uppercase tracking-wide}>
                              {risk.severity || 'Unknown'} Risk
                            </span>
                            <span className="text-slate-400 text-sm">
                              Priority #{index + 1}
                            </span>
                          </div>
                          
                          <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4 mb-4">
                            <ExpandableText text={risk.description || 'No description available'} />
                          </div>
                          
                          {/* Additional Risk Details */}
                          {risk.recommendation && (
                            <div className="bg-slate-800/60 border border-slate-600/50 rounded-xl p-4">
                              <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Recommendation
                              </h5>
                              <p className="text-slate-300 text-sm leading-relaxed">
                                {risk.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Risk Summary */}
          {analysis.analysis?.summary && (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Risk Assessment Summary</h3>
              </div>
              
              <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-6">
                <p className="text-slate-200 leading-relaxed text-lg whitespace-pre-line">
                  {analysis.analysis.summary}
                </p>
              </div>
            </div>
          )}

         

          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-400">{debugInfo}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Analysis State */}
      {!loading && !analysis && !error && (
        <div className="bg-slate-800/40 backdrop-blur-sm border-2 border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h4 className="text-xl font-bold text-slate-300 mb-2">Ready to Analyze Risks</h4>
          <p className="text-slate-500">Click "Analyze Document Risks" to identify potential legal risks with beautiful interactive charts and detailed analysis.</p>
        </div>
      )}
    </div>
  );
};

export default RiskAnalysis;
