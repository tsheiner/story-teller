import { ChartConfig } from "../components/ChartComponent";

// Define a regex pattern to match chart commands in Claude's responses
const CHART_PATTERN = /{{chart:(line|bar|column|pie|area|scatter)(?:\s*\n|\s+)([\s\S]*?)}}/g;

export class ChartParserService {
  /**
   * Parse message content to extract chart commands
   * @param content The message content to parse
   * @returns An array of extracted chart configurations
   */
  static parseChartCommands(content: string): ChartConfig[] {
    const charts: ChartConfig[] = [];
    
    // First, find all chart pattern matches
    let match;
    while ((match = CHART_PATTERN.exec(content)) !== null) {
      try {
        const chartType = match[1] as ChartConfig['type'];
        const chartConfigText = match[2];
        
        // Parse the chart config text
        const config = this.parseChartConfig(chartConfigText, chartType);
        
        // Generate a unique ID for the chart
        const id = `chart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        charts.push({
          id,
          type: chartType,
          ...config
        });
      } catch (error) {
        console.error('Error parsing chart command:', error);
      }
    }
    
    return charts;
  }
  
  /**
   * Parse the configuration text for a chart
   * @param configText The configuration text to parse
   * @param chartType The type of chart
   * @returns A partial chart configuration
   */
  private static parseChartConfig(configText: string, chartType: ChartConfig['type']): Partial<ChartConfig> {
    const config: any = {
      title: '',
      xAxis: { title: '' },
      yAxis: { title: '' },
      data: []
    };
    
    // Split by lines and process each line
    const lines = configText.split('\n');
    
    let inDataBlock = false;
    let currentDataBlock = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Handle data block
      if (trimmedLine === 'data: [' || trimmedLine === 'data:[') {
        inDataBlock = true;
        currentDataBlock = '[';
        continue;
      }
      
      if (inDataBlock) {
        if (trimmedLine === ']' || trimmedLine.endsWith(']')) {
          inDataBlock = false;
          currentDataBlock += trimmedLine.endsWith(']') ? trimmedLine : ']';
          try {
            // Parse the data block
            const dataArray = JSON.parse(currentDataBlock.replace(/(\w+):/g, '"$1":'));
            config.data = dataArray.map((item: any) => ({
              name: item.name,
              values: item.values
            }));
          } catch (error) {
            console.error('Error parsing data block:', error);
            console.error('Data block:', currentDataBlock);
          }
        } else {
          currentDataBlock += trimmedLine;
        }
        continue;
      }
      
      // Parse key-value pairs
      if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':', 2);
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        
        if (trimmedKey === 'title') {
          config.title = trimmedValue;
        } else if (trimmedKey === 'xAxis') {
          config.xAxis.title = trimmedValue;
        } else if (trimmedKey === 'yAxis') {
          config.yAxis.title = trimmedValue;
        } else if (trimmedKey === 'categories') {
          try {
            // Parse categories as JSON array
            const categoriesText = trimmedValue.startsWith('[') && trimmedValue.endsWith(']')
              ? trimmedValue
              : `[${trimmedValue}]`;
            config.xAxis.categories = JSON.parse(categoriesText.replace(/(\w+):/g, '"$1":'));
          } catch (error) {
            console.error('Error parsing categories:', error);
          }
        }
      }
    }
    
    return config;
  }
  
  /**
   * Replace chart commands in the original message with placeholders
   * @param content The original message content
   * @returns Cleaned message with chart commands replaced by placeholders
   */
  static replaceChartCommands(content: string): string {
    // Replace chart commands with a placeholder text
    return content.replace(CHART_PATTERN, 
      (_, type) => `[Chart visualization created - Check the workspace panel]`);
  }
  
  /**
   * Process a message to extract charts and update the message text
   * @param content The message content to process
   * @returns Object containing processed message and any extracted charts
   */
  static processMessage(content: string): { 
    processedContent: string; 
    extractedCharts: ChartConfig[] 
  } {
    const charts = this.parseChartCommands(content);
    const processedContent = this.replaceChartCommands(content);
    
    return {
      processedContent,
      extractedCharts: charts
    };
  }
}