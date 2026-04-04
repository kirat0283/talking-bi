import { useMemo, useRef, useState } from 'react';
import ReactPlotly from 'react-plotly.js';
import { Download, Sparkles, LayoutDashboard } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Plot = ReactPlotly.default || ReactPlotly;

const DEFAULT_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
const NEON_COLORS = ['#FF007F', '#00F0FF', '#FFE600', '#00FF00', '#FF4D4D', '#BF00FF', '#FF00FF'];
const WARM_COLORS = ['#D97706', '#EA580C', '#DC2626', '#9A3412', '#7C2D12', '#B45309', '#C2410C'];

const Dashboard = ({ payload, viewMode, activeTab = 'tab1' }) => {
  const { kpis, time_range, chart_types, data, columns, suggested_colors, insights, explanation } = payload;
  const dashboardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    const originalHeight = dashboardRef.current.style.height;
    dashboardRef.current.style.height = 'auto';

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617', // Match dark slate background
        windowHeight: dashboardRef.current.scrollHeight, // capture the full height
        onclone: (clonedDoc) => {
            const tables = clonedDoc.querySelectorAll('.max-h-96');
            tables.forEach(t => {
                t.style.maxHeight = 'none';
                t.style.overflow = 'visible';
            });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`TalkingBI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      dashboardRef.current.style.height = originalHeight;
      setIsExporting(false);
    }
  };



  const validData = Array.isArray(data) && data.length > 0;

  let activeChartTypes = chart_types && chart_types.length > 0 ? chart_types.map(t => t.toLowerCase()) : ['bar'];
  if (activeTab === 'tab2') {
      activeChartTypes = ['pie', 'donut', 'bar'];
  } else if (activeTab === 'tab3') {
      activeChartTypes = ['area', 'scatter', 'funnel'];
  }
  
  let basePalette = DEFAULT_COLORS;
  if (activeTab === 'tab2') basePalette = NEON_COLORS;
  if (activeTab === 'tab3') basePalette = WARM_COLORS;

  const colorPalette = (suggested_colors && suggested_colors.length > 0 && activeTab === 'tab1') 
      ? [...suggested_colors, ...basePalette] 
      : basePalette;

  const downloadCSV = () => {
    if (!validData) return;
    const header = columns.join(",");
    const rows = data.map(row => columns.map(col => `"${row[col]}"`).join(","));
    const csvContext = [header, ...rows].join("\n");
    const blob = new Blob([csvContext], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TalkingBI_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderCharts = useMemo(() => {
    if (!validData) return null;

    const numericCols = columns.filter(col => typeof data[0][col] === 'number');
    const categoryCols = columns.filter(col => typeof data[0][col] === 'string');

    if (numericCols.length === 0) {
        return (
            <div className="bg-[#0F172A] p-8 rounded-3xl shadow-xl border border-slate-800 w-full mb-8 text-center text-slate-400 col-span-full">
                <span className="text-xl inline-block mb-3">📊</span>
                <p>The query returned no numeric measures to plot visually. See the Extract Table.</p>
            </div>
        );
    }
    
    // Choose the best X axis
    const xAxisCol = categoryCols.includes('order_date') ? 'order_date' : 
                     (categoryCols.includes('date') ? 'date' : 
                     (categoryCols.length > 0 ? categoryCols[0] : columns[0]));

    const uniqueCharts = [...new Set(activeChartTypes)].filter(t => t !== 'table');

    return uniqueCharts.map((chartType, idx) => {
        const xValues = data.map((row, index) => categoryCols.length > 0 ? row[xAxisCol] : `Seq ${index+1}`);

        const baseLayout = {
            title: { text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analytics - ${time_range || 'All Time'}`, font: { color: '#f8fafc', size: 16, family: 'Inter, sans-serif' } },
            autosize: true,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#94a3b8', family: 'Inter, sans-serif' },
            margin: { l: 60, r: 40, t: 70, b: 60 },
            hovermode: 'closest',
            legend: { orientation: 'h', y: -0.2, font: { size: 12 } }
        };

        const gridOptions = { gridcolor: '#1E293B', gridwidth: 1, tickfont: { color: '#94a3b8' }};

        let plotData = [];
        let layoutAdditions = {
            xaxis: gridOptions,
            yaxis: gridOptions
        };

        if (chartType === 'pie' || chartType === 'donut') {
            layoutAdditions = {};
            plotData = [{
                labels: xValues,
                values: data.map(row => row[numericCols[0]]),
                type: 'pie',
                hole: chartType === 'donut' ? 0.6 : 0,
                name: numericCols[0],
                marker: { colors: colorPalette },
                textinfo: 'percent',
                hoverinfo: 'label+value',
                pull: chartType === 'donut' ? 0.02 : 0
            }];
        } else if (chartType === 'funnel') {
            layoutAdditions = { xaxis: gridOptions, yaxis: gridOptions };
            plotData = numericCols.map((yCol, i) => ({
                type: 'funnel',
                y: xValues,
                x: data.map(row => row[yCol]),
                name: yCol,
                marker: { color: colorPalette[i % colorPalette.length] }
            }));
        } else {
            plotData = numericCols.map((yCol, i) => {
                const conf = {
                    x: xValues,
                    y: data.map(row => row[yCol]),
                    name: yCol,
                    marker: { color: colorPalette[i % colorPalette.length] },
                    hoverlabel: { bgcolor: '#0F172A', font: { color: 'white' } }
                };

                if (chartType === 'bar') {
                    conf.type = 'bar';
                    conf.marker.opacity = 0.9;
                } else if (chartType === 'scatter') {
                    conf.type = 'scatter';
                    conf.mode = 'markers';
                    conf.marker.size = 10;
                } else if (chartType === 'area') {
                    conf.type = 'scatter';
                    conf.mode = 'lines';
                    conf.fill = 'tozeroy';
                    conf.line = { shape: 'spline', smoothing: 1 };
                } else {
                    conf.type = 'scatter';
                    conf.mode = 'lines+markers';
                    conf.line = { shape: 'spline', smoothing: 1.3, width: 3 };
                    conf.marker.size = 8;
                }
                return conf;
            });
        }

        const layout = { ...baseLayout, ...layoutAdditions };

        return (
            <div key={`${chartType}-${idx}`} className="bg-slate-800/40 p-4 rounded-[2rem] shadow-md border border-white/10 relative group overflow-hidden transition-all duration-500 hover:shadow-indigo-500/20 hover:border-indigo-500/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)] -mr-10 -mt-10 pointer-events-none"></div>
                <Plot
                    data={plotData}
                    layout={layout}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '380px' }}
                    config={{ 
                        responsive: true, 
                        displayModeBar: 'hover',
                        displaylogo: false,
                        toImageButtonOptions: {
                           format: 'png', 
                           filename: `talking_bi_chart_${chartType}`,
                           height: 600,
                           width: 800,
                           scale: 2
                        },
                        modeBarButtonsToRemove: ['lasso2d', 'select2d']
                    }}
                />
            </div>
        );
    });

  }, [data, columns, activeChartTypes, time_range, colorPalette]);

  const renderCopilotBlock = () => (
      <div className={`bg-black/60 border ${activeTab === 'tab2' ? 'border-pink-500/30 shadow-md' : activeTab === 'tab3' ? 'border-orange-500/30' : 'border-indigo-500/30 shadow-md'} rounded-[2rem] p-6 relative overflow-hidden group w-full h-full`}>
          <div className={`absolute -top-10 -right-10 w-40 h-40 ${activeTab === 'tab2' ? 'bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.15)_0%,_transparent_70%)]' : activeTab === 'tab3' ? 'bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.15)_0%,_transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]'} transition-all duration-700`}></div>
          <h3 className={`${activeTab === 'tab2' ? 'text-pink-400' : activeTab === 'tab3' ? 'text-orange-400' : 'text-indigo-400'} font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2 mb-4 font-mono z-10 relative`}>
              <Sparkles size={14}/> {activeTab === 'tab2' ? 'Cyberpunk Matrix' : activeTab === 'tab3' ? 'Temporal Flow' : 'Neural Core Analysis'}
          </h3>
          <div className={`text-sm font-light ${activeTab === 'tab2' ? 'text-pink-100/90' : activeTab === 'tab3' ? 'text-orange-100/90' : 'text-indigo-100/90'} leading-relaxed space-y-2 whitespace-pre-wrap relative z-10 font-mono tracking-wide`}>
              {insights}
          </div>
      </div>
  );

  const renderKPIBlock = () => (
      <div className={`grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6 w-full h-full`}>
          {columns.filter(c => typeof data[0][c] === 'number').map((col, idx) => {
              const total = data.reduce((sum, row) => sum + Number(row[col] || 0), 0);
              const accentColor = activeTab === 'tab2' ? 'text-pink-400' : activeTab === 'tab3' ? 'text-orange-400' : 'text-cyan-400';
              return (
                  <div key={idx} className={`bg-slate-800/40 p-6 rounded-[2rem] border ${activeTab === 'tab2' ? 'border-pink-500/20' : activeTab === 'tab3' ? 'border-orange-500/20' : 'border-cyan-500/20'} shadow-md flex flex-col justify-center relative overflow-hidden group hover:bg-slate-800/60 transition-all duration-500`}>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] z-10">{col.replace(/_/g, ' ')}</h3>
                      <p className={`text-4xl lg:text-5xl font-black ${accentColor} mt-3 tracking-tighter z-10 drop-shadow-md`}>
                          {total > 1000000 ? (total/1000000).toFixed(2) + 'M' : total > 1000 ? (total/1000).toFixed(1) + 'k' : total.toFixed(2)}
                      </p>
                      <div className="absolute -bottom-6 -right-2 text-white/5 text-8xl font-black pointer-events-none z-0 group-hover:scale-110 transition-transform duration-700">#</div>
                  </div>
              );
          })}
      </div>
  );

  const renderChartsSection = () => (
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 shrink-0 flex-col'} w-full`}>
         {renderCharts}
      </div>
  );

  return (
    <div ref={dashboardRef} className="w-full h-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Semantic Top Dashboard Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tighter flex items-center gap-3 drop-shadow-sm">
              <LayoutDashboard size={32} className="text-indigo-400"/> DATA_STREAMS
          </h2>
          <div className="flex flex-wrap gap-2 mt-4">
              {kpis?.map((kpi, idx) => (
                  <span key={idx} className="bg-slate-700/80 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-white/10 shadow-sm">
                      {kpi.replace(/_/g, ' ').toUpperCase()}
                  </span>
              ))}
              {time_range && time_range.toLowerCase() !== 'unknown' && (
                   <span className="bg-indigo-900/80 text-indigo-200 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-indigo-500/30 shadow-sm">
                       T_{time_range.toUpperCase()}
                   </span>
              )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right z-10 relative">
            <button 
                data-html2canvas-ignore="true"
                onClick={exportPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/40 px-5 py-2 rounded-full text-xs font-black tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
            >
                <Download size={14} strokeWidth={3}/> {isExporting ? 'GENERATING PDF...' : 'DOWNLOAD PDF'}
            </button>
            <p className="text-[10px] font-mono text-indigo-300/80 bg-black/60 p-3 rounded-2xl border border-indigo-500/20 line-clamp-2 max-w-md leading-relaxed shadow-sm">
                 <span className="text-indigo-400 font-bold tracking-widest uppercase block mb-1">▶ SQL_QUERY_RESOLVED</span> {explanation}
            </p>
        </div>
      </div>

      {!validData ? (
        <div className="p-10 text-center bg-[#0F172A] text-slate-400 border-2 border-dashed border-slate-800 rounded-3xl">
           <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
           <p className="max-w-md mx-auto">This context yielded empty tabular records.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
            
            {/* Conditional Layouts based on ActiveTab */}
            {activeTab === 'tab1' && (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-2">
                        <div className="xl:col-span-1">{renderCopilotBlock()}</div>
                        <div className="xl:col-span-3">{renderKPIBlock()}</div>
                    </div>
                    {renderChartsSection()}
                </>
            )}

            {activeTab === 'tab2' && (
                <>
                    <div className="mb-2">
                        {renderKPIBlock()}
                    </div>
                    {renderChartsSection()}
                    <div className="mt-2 w-full">
                        {renderCopilotBlock()}
                    </div>
                </>
            )}

            {activeTab === 'tab3' && (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-2">
                        <div>{renderCopilotBlock()}</div>
                        <div>{renderKPIBlock()}</div>
                    </div>
                    {renderChartsSection()}
                </>
            )}

            {/* Holographic Data Table View */}
            <div className={`mt-4 rounded-[2rem] border ${activeTab === 'tab2' ? 'border-pink-500/20 shadow-lg' : activeTab === 'tab3' ? 'border-orange-500/20' : 'border-cyan-500/20 shadow-lg'} overflow-hidden bg-slate-900/80`}>
                <div className={`p-5 border-b ${activeTab === 'tab2' ? 'border-pink-500/20' : activeTab === 'tab3' ? 'border-orange-500/20' : 'border-cyan-500/20'} bg-black/20 flex justify-between items-center`}>
                     <h3 className={`font-black ${activeTab === 'tab2' ? 'text-pink-400' : activeTab === 'tab3' ? 'text-orange-400' : 'text-cyan-400'} tracking-widest uppercase text-xs flex items-center gap-2`}>
                         DATABANK_EXTRACT
                     </h3>
                     <button 
                        onClick={downloadCSV}
                        className={`flex items-center gap-2 ${activeTab === 'tab2' ? 'bg-pink-500/20 text-pink-300 border-pink-500/50 hover:bg-pink-500/40' : activeTab === 'tab3' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/40'} border px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all active:scale-95`}
                     >
                        <Download size={14} strokeWidth={3}/> EXPORT_CSV
                     </button>
                </div>
                <div className="overflow-x-auto max-h-96 custom-scrollbar">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className={`text-[10px] uppercase bg-slate-950/90 ${activeTab === 'tab2' ? 'text-pink-500/70' : activeTab === 'tab3' ? 'text-orange-500/70' : 'text-cyan-500/70'} sticky top-0 z-10 font-bold tracking-[0.2em]`}>
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-6 py-4">{col.replace(/_/g, ' ')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${activeTab === 'tab2' ? 'divide-pink-900/30' : activeTab === 'tab3' ? 'divide-orange-900/30' : 'divide-cyan-900/30'} font-mono text-[11px]`}>
                            {data.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-white/[0.05] transition-colors duration-200 group`}>
                                    {columns.map((col, i) => (
                                        <td key={i} className="px-6 py-3 font-medium text-slate-400 group-hover:text-white transition-colors">
                                            {typeof row[col] === 'number' && !Number.isInteger(row[col]) 
                                                ? row[col].toFixed(2) 
                                                : String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
