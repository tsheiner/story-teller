import { ChartConfig } from "../components/ChartComponent";

// Define multiple patterns to catch different table formats
const TABLE_PATTERNS = [
  /{{table:\s*([\s\S]*?)\s*}}/g,  // Standard format
  /\{\{table:\s*\n([\s\S]*?)\}\}/g,  // Newline after colon
  /\{\{ *table *:\s*([\s\S]*?)\s*\}\}/g,  // With spaces around table
];

// Define a regex pattern to match chart commands
const CHART_PATTERN = /{{chart:(line|bar|column|pie|area|scatter)(?:\s*\n|\s+)([\s\S]*?)}}/g;

// Define interfaces for tables
export interface TableConfig {
  id: string;
  type: 'table';
  title: string;
  columns: string[];
  data: string[][];
}

export class ChartParserService {
  /**
   * Parse message content to extract both chart and table commands
   * @param content The message content to parse
   * @returns An array of extracted configurations (charts and tables)
   */
  static parseChartCommands(content: string): (ChartConfig | TableConfig)[] {
    const visualizations: (ChartConfig | TableConfig)[] = [];
    console.log('=== PARSING MESSAGE FOR VISUALIZATIONS ===');
    console.log('Content length:', content.length);
    
    // Find all chart pattern matches
    let match;
    while ((match = CHART_PATTERN.exec(content)) !== null) {
      try {
        const chartType = match[1] as ChartConfig['type'];
        const chartConfigText = match[2];
        
        // Parse the chart config text
        const config = this.parseChartConfig(chartConfigText, chartType);
        
        // Generate a unique ID for the chart
        const id = `chart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        visualizations.push({
          id,
          type: chartType,
          ...config
        });
      } catch (error) {
        console.error('Error parsing chart command:', error);
      }
    }
    
    // Try all table patterns
    for (const pattern of TABLE_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(content)) !== null) {
        try {
          const tableConfigText = match[1];
          console.log('Found table command with pattern, raw text:', tableConfigText);
          
          // Parse the table config text
          const config = this.parseTableConfig(tableConfigText);
          console.log('Parsed table config:', config);
          
          // Validate table config
          if (!config.title || !config.columns || !config.data || config.columns.length === 0) {
            console.error('Invalid table configuration:', config);
            continue;
          }
          
          // Generate a unique ID for the table
          const id = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          const tableConfig = {
            id,
            type: 'table' as const,
            ...config
          };
          
          console.log('Adding table to visualizations:', tableConfig);
          visualizations.push(tableConfig);
        } catch (error) {
          console.error('Error parsing table command:', error);
          console.error('Stack trace:', error);
        }
      }
    }
    
    console.log('Total visualizations found:', visualizations.length);
    return visualizations;
  }
  
  /**
   * Parse the configuration text for a chart
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
   * Enhanced table parser that can handle various formats
   */
  private static parseTableConfig(configText: string): Partial<TableConfig> {
    console.log('=== PARSING TABLE CONFIG ===');
    console.log('Raw input:', configText);
    
    const config: any = {
      title: '',
      columns: [],
      data: []
    };
    
    // Try to parse as a more flexible format
    try {
      // First, try to find key patterns using more flexible matching
      const titleMatch = configText.match(/^\s*title:\s*(.+?)$/m);
      if (titleMatch) {
        config.title = titleMatch[1].trim();
        console.log('Found title:', config.title);
      }
      
      // Extract columns - look for various patterns
      const columnsPattern = /columns:\s*(\[[^\]]*\])/i;
      const columnsMatch = configText.match(columnsPattern);
      if (columnsMatch) {
        try {
          // Clean up the columns string and parse
          let columnsStr = columnsMatch[1];
          // Replace any quotes that might have been escaped or malformed
          columnsStr = columnsStr.replace(/'/g, '"');
          config.columns = JSON.parse(columnsStr);
          console.log('Found columns:', config.columns);
        } catch (e) {
          console.error('Error parsing columns:', e);
          // Try a more manual approach
          const columnsList = columnsMatch[1].replace(/[\[\]"']/g, '').split(',');
          config.columns = columnsList.map(col => col.trim());
          console.log('Manual columns parsing result:', config.columns);
        }
      }
      
      // Extract data - look for data block
      const dataPattern = /data:\s*(\[[\s\S]*?\])/i;
      const dataMatch = configText.match(dataPattern);
      if (dataMatch) {
        try {
          // Clean up the data string
          let dataStr = dataMatch[1];
          // Handle various quote styles and formats
          dataStr = dataStr.replace(/'/g, '"');
          config.data = JSON.parse(dataStr);
          console.log('Found data:', config.data);
        } catch (e) {
          console.error('Error parsing data JSON:', e);
          console.error('Data string was:', dataMatch[1]);
          
          // Fallback: try to parse manually
          try {
            const dataContent = dataMatch[1]
              .replace(/^\s*\[\s*/, '') // Remove opening bracket
              .replace(/\s*\]\s*$/, '') // Remove closing bracket
              .split(/\],\s*\[/) // Split by row delimiters
              .map(row => {
                return row
                  .replace(/^\s*\[\s*/, '') // Clean row start
                  .replace(/\s*\]\s*$/, '') // Clean row end
                  .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/) // Split by comma (respecting quotes)
                  .map(cell => cell.trim().replace(/^["']|["']$/g, '')); // Clean each cell
              });
            config.data = dataContent;
            console.log('Manual data parsing result:', config.data);
          } catch (manualError) {
            console.error('Manual parsing also failed:', manualError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in parseTableConfig:', error);
    }
    
    console.log('Final parsed config:', config);
    console.log('=== END TABLE PARSING ===');
    
    return config;
  }
  
  /**
   * Replace chart and table commands in the original message with placeholders
   */
  static replaceChartCommands(content: string): string {
    // Replace chart commands with a placeholder text
    let result = content.replace(CHART_PATTERN, 
      (_, type) => `[Chart visualization created - Check the workspace panel]`);
    
    // Replace table commands with placeholders using all patterns
    for (const pattern of TABLE_PATTERNS) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, 
        () => `[Data table created - Check the workspace panel]`);
    }
    
    return result;
  }
  
  /**
   * Process a message to extract charts and tables, and update the message text
   */
  static processMessage(content: string): { 
    processedContent: string; 
    extractedCharts: (ChartConfig | TableConfig)[] 
  } {
    console.log('=== PROCESSING MESSAGE FOR VISUALIZATIONS ===');
    console.log('Input content length:', content.length);
    
    // Log a portion of the content to see what we're working with
    console.log('Content sample:', content.substring(0, 500) + '...');
    
    const visualizations = this.parseChartCommands(content);
    console.log('Found', visualizations.length, 'visualizations');
    
    const processedContent = this.replaceChartCommands(content);
    
    return {
      processedContent,
      extractedCharts: visualizations
    };
  }
}