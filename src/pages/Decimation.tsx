import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Upload, BarChart3, Settings, Download, CheckCircle, AlertCircle, XCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FileUpload from "@/components/ui/file-upload";
import TableInput from "@/components/ui/table-input";
import DrillChart from "@/components/ui/drill-chart";
import ConfigurationSidebar from "@/components/ui/configuration-sidebar";
import { useNavigate } from "react-router-dom";

interface DataQualityMetrics {
  completeness: number;
  conformity: number;
  statistics: number;
  overall: number;
}

interface DrillingData {
  depth: number;
  wob: number;
  rpm: number;
  rop: number;
}

interface SectionData {
  id: string;
  startDepth: string;
  endDepth: string;
  holeDiameter: string;
}

interface FormationData {
  id: string;
  startDepth: string;
  endDepth: string;
  formationName: string;
}

interface DecimationConfig {
  intervalBins: number;
  filterMode: 'section' | 'formation' | 'all';
  selectedSection?: string;
  selectedFormation?: string;
  enableSmoothing: boolean;
  outlierRemoval: boolean;
}

const Decimation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics | null>(null);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [formationData, setFormationData] = useState<FormationData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drillingData, setDrillingData] = useState<DrillingData[]>([]);
  const [decimationConfig, setDecimationConfig] = useState<DecimationConfig>({
    intervalBins: 20,
    filterMode: 'all',
    enableSmoothing: false,
    outlierRemoval: false
  });

  const steps = [
    { id: 1, title: "Upload Data", description: "Upload XLSX, CSV, or LAS file" },
    { id: 2, title: "Data Audit", description: "Quality assessment and scoring" },
    { id: 3, title: "Section Input", description: "Define sections and formations" },
    { id: 4, title: "Visualization", description: "WOB, RPM, ROP analysis" },
    { id: 5, title: "Configuration", description: "Decimation settings" },
    { id: 6, title: "Export", description: "Download processed data" }
  ];

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    
    // Simulate data processing and quality assessment
    setTimeout(() => {
      // Mock data quality metrics
      const mockQuality: DataQualityMetrics = {
        completeness: Math.floor(Math.random() * 20) + 80, // 80-100%
        conformity: Math.floor(Math.random() * 15) + 85,   // 85-100%
        statistics: Math.floor(Math.random() * 10) + 90,   // 90-100%
        overall: 0
      };
      mockQuality.overall = Math.round((mockQuality.completeness + mockQuality.conformity + mockQuality.statistics) / 3);
      
      setDataQuality(mockQuality);
      
      // Mock drilling data with more realistic values
      const mockData: DrillingData[] = Array.from({ length: 500 }, (_, i) => ({
        depth: 1000 + i * 2, // Every 2 feet
        wob: 15 + Math.sin(i * 0.02) * 8 + Math.random() * 3,
        rpm: 120 + Math.cos(i * 0.015) * 30 + Math.random() * 10,
        rop: 12 + Math.sin(i * 0.01) * 6 + Math.random() * 4
      }));
      
      setDrillingData(mockData);
      setIsProcessing(false);
      setCurrentStep(2);
    }, 2000);
  };

  const handleConfirmSections = (sections: SectionData[], formations: FormationData[]) => {
    setSectionData(sections);
    setFormationData(formations);
    setCurrentStep(4);
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return "text-success";
    if (score >= 85) return "text-warning";
    return "text-destructive";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 95) return CheckCircle;
    if (score >= 85) return AlertCircle;
    return XCircle;
  };

  // Calculate decimated data based on configuration
  const decimatedData = useMemo(() => {
    if (!drillingData.length || decimationConfig.intervalBins === 0) return null;

    let filteredData = drillingData;
    
    // Apply filtering based on mode
    if (decimationConfig.filterMode === 'section' && decimationConfig.selectedSection) {
      const section = sectionData.find(s => s.id === decimationConfig.selectedSection);
      if (section) {
        const startDepth = parseFloat(section.startDepth);
        const endDepth = parseFloat(section.endDepth);
        filteredData = drillingData.filter(d => d.depth >= startDepth && d.depth <= endDepth);
      }
    } else if (decimationConfig.filterMode === 'formation' && decimationConfig.selectedFormation) {
      const formation = formationData.find(f => f.id === decimationConfig.selectedFormation);
      if (formation) {
        const startDepth = parseFloat(formation.startDepth);
        const endDepth = parseFloat(formation.endDepth);
        filteredData = drillingData.filter(d => d.depth >= startDepth && d.depth <= endDepth);
      }
    }

    // Perform decimation
    const binSize = Math.ceil(filteredData.length / decimationConfig.intervalBins);
    const decimated: DrillingData[] = [];

    for (let i = 0; i < filteredData.length; i += binSize) {
      const bin = filteredData.slice(i, i + binSize);
      if (bin.length > 0) {
        // Calculate average for each parameter
        const avgPoint: DrillingData = {
          depth: bin.reduce((sum, p) => sum + p.depth, 0) / bin.length,
          wob: bin.reduce((sum, p) => sum + p.wob, 0) / bin.length,
          rpm: bin.reduce((sum, p) => sum + p.rpm, 0) / bin.length,
          rop: bin.reduce((sum, p) => sum + p.rop, 0) / bin.length
        };
        decimated.push(avgPoint);
      }
    }

    return decimated;
  }, [drillingData, decimationConfig, sectionData, formationData]);

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Upload Drilling Data</h2>
              <p className="text-muted-foreground">
                Upload your drilling data file to begin the decimation process
              </p>
            </div>
            
            <FileUpload 
              onFileSelect={handleFileUpload}
              acceptedFileTypes={['.xlsx', '.csv', '.las']}
              maxFileSize={100 * 1024 * 1024} // 100MB
            />

            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Processing file and analyzing data quality...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Data Quality Assessment</h2>
              <p className="text-muted-foreground">
                Quality analysis of your uploaded data
              </p>
            </div>

            {dataQuality && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Data Completeness", value: dataQuality.completeness, description: "Missing data points" },
                  { label: "Data Conformity", value: dataQuality.conformity, description: "Format compliance" },
                  { label: "Statistical Quality", value: dataQuality.statistics, description: "Data distribution" },
                  { label: "Overall Score", value: dataQuality.overall, description: "Combined quality" }
                ].map((metric, index) => {
                  const Icon = getQualityIcon(metric.value);
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <Icon className={`h-8 w-8 mx-auto ${getQualityColor(metric.value)}`} />
                          <div className="text-2xl font-bold">{metric.value}%</div>
                          <div className="text-sm font-medium">{metric.label}</div>
                          <div className="text-xs text-muted-foreground">{metric.description}</div>
                          <Progress value={metric.value} className="w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Data quality assessment complete. Your data meets industry standards for analysis.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button onClick={() => setCurrentStep(3)} size="lg">
                Continue to Section Input
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Section & Formation Input</h2>
              <p className="text-muted-foreground">
                Define drilling sections and formations for analysis. Copy data from Excel and paste directly into the tables.
              </p>
            </div>

            <TableInput onConfirm={handleConfirmSections} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Data Visualization & Configuration</h2>
              <p className="text-muted-foreground">
                WOB, RPM, and ROP analysis vs depth. Use the sidebar to configure decimation settings.
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Configuration Sidebar */}
              <div className="lg:col-span-1">
                <ConfigurationSidebar
                  config={decimationConfig}
                  onConfigChange={setDecimationConfig}
                  sections={sectionData.map(s => ({ 
                    id: s.id, 
                    name: `${s.startDepth}-${s.endDepth}ft`, 
                    startDepth: s.startDepth, 
                    endDepth: s.endDepth 
                  }))}
                  formations={formationData.map(f => ({ 
                    id: f.id, 
                    name: f.formationName, 
                    startDepth: f.startDepth, 
                    endDepth: f.endDepth 
                  }))}
                />
              </div>

              {/* Charts */}
              <div className="lg:col-span-3 space-y-6">
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="wob"
                  title="Weight on Bit (WOB)"
                  unit="klbs"
                  color="hsl(var(--chart-1))"
                />
                
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="rpm"
                  title="Rotary Speed (RPM)"
                  unit="rpm"
                  color="hsl(var(--chart-2))"
                />
                
                <DrillChart
                  data={drillingData}
                  decimatedData={decimatedData}
                  parameter="rop"
                  title="Rate of Penetration (ROP)"
                  unit="ft/hr"
                  color="hsl(var(--chart-3))"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep(5)}>
                Configure Export
              </Button>
              <Button onClick={() => setCurrentStep(6)}>
                Export Data
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Modules
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Data Decimation Tool</h1>
                <p className="text-sm text-muted-foreground">Advanced drilling data analysis</p>
              </div>
            </div>
            
            <Badge variant="secondary">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  step.id === currentStep ? 'text-primary' : 
                  step.id < currentStep ? 'text-success' : 'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id === currentStep ? 'bg-primary text-primary-foreground' :
                    step.id < currentStep ? 'bg-success text-success-foreground' : 'bg-muted'
                  }`}>
                    {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="hidden md:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentStep > 1 && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>
          </div>
        )}
        {renderStepContent()}
      </main>
    </div>
  );
};

export default Decimation;