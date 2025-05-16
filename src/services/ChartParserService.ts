import { ChartConfig } from "../components/ChartComponent";

// Define a single flexible pattern to catch all table formats
// This pattern accounts for variations in spacing, newlines, and formatting
const TABLE_PATTERN = /\{\{\s*table\s*:\s*([\s\S]*?)\s*\}\}/g;

// Define a regex pattern to match chart commands
const CHART_PATTERN = /{{chart:(line|bar|column|pie|area|scatter|timeseries)(?:\s*\n|\s+)([\s\S]*?)}}/g;

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
    
    // Reset regex state
    TABLE_PATTERN.lastIndex = 0;
    
    // Use our single table pattern
    while ((match = TABLE_PATTERN.exec(content)) !== null) {
      try {
        const tableConfigText = match[1];
        console.log('Found table command, raw text:', tableConfigText);
        
        // Parse the table config text
        const config = this.parseTableConfig(tableConfigText);
        console.log('Parsed table config:', config);
        
        // Validate table config
        if (!config.title || !config.columns || !config.data || config.columns.length === 0) {
          console.error('Invalid table configuration:', config);
          continue;
        }
        
        // Generate a more unique ID with timestamp + hash of content
        // This prevents ID collisions by including content-based uniqueness
        const timestamp = Date.now();
        const contentHash = this.simpleHash(tableConfigText);
        const id = `table-${timestamp}-${contentHash}`;
        
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
            let categoriesText = trimmedValue.trim();

            // Ensure it's wrapped in brackets
            if (!categoriesText.startsWith('[') || !categoriesText.endsWith(']')) {
              categoriesText = `[${categoriesText}]`;
            }

            console.log('Original categories text:', trimmedValue);
            console.log('Processing categories:', categoriesText);

            // Handle escaped quotes from AI responses like \"06:00\"
            if (categoriesText.includes('\\"')) {
              categoriesText = categoriesText.replace(/\\"/g, '"');
              console.log('After unescaping quotes:', categoriesText);
            }

            try {
              // Try to parse as JSON
              config.xAxis.categories = JSON.parse(categoriesText);
              console.log('Successfully parsed categories as JSON:', config.xAxis.categories);
            } catch (jsonError) {
              console.log('JSON parsing failed, trying manual extraction...');

              // Fallback: extract quoted strings manually
              const matches = categoriesText.match(/"([^"]*)"/g);
              if (matches) {
                config.xAxis.categories = matches.map(match => match.replace(/"/g, ''));
                console.log('Manually extracted categories:', config.xAxis.categories);
              } else {
                // Last resort: split by comma and clean up
                const parts = categoriesText.replace(/[\[\]]/g, '').split(',');
                config.xAxis.categories = parts.map(p => p.trim().replace(/['"]/g, '')).filter(p => p.length > 0);
                console.log('Fallback split categories:', config.xAxis.categories);
              }
            }
          } catch (error) {
            console.error('Error parsing categories:', error);
            console.error('Categories text was:', trimmedValue);
          }
        }
      }
    }

    // Handle timeseries chart type
    if (chartType === 'timeseries') {
      // For timeseries, make sure we have categories for the time axis
      if (!config.xAxis.categories || config.xAxis.categories.length === 0) {
        console.warn('Time series chart is missing categories for time axis');
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
      
      // Special case: look for data section spanning multiple lines to end of config
      // This is a more comprehensive approach to get the entire data block
      const fullDataMatch = configText.match(/data:\s*(\[\s*\[[\s\S]*$)/i);
      
      if (fullDataMatch) {
        console.log('Found full data section match, extracting properly');
        // Extract just the data array by finding balanced brackets
        let dataStr = fullDataMatch[1];
        let bracketCount = 0;
        let endIndex = 0;
        
        // Find the matching closing bracket for the outer array
        for (let i = 0; i < dataStr.length; i++) {
          if (dataStr[i] === '[') bracketCount++;
          if (dataStr[i] === ']') bracketCount--;
          
          if (bracketCount === 0) {
            endIndex = i + 1; // Include the closing bracket
            break;
          }
        }
        
        if (endIndex > 0) {
          dataStr = dataStr.substring(0, endIndex);
          console.log('Extracted balanced data section:', dataStr);
          // Now proceed with parsing this properly balanced data string
          try {
            // Clean up the data for JSON parsing
            dataStr = dataStr.replace(/'/g, '"');
            // Fix common formatting issues
            dataStr = dataStr.replace(/,\s*\]/g, ']');
            
            const data = JSON.parse(dataStr);
            if (Array.isArray(data)) {
              config.data = data;
              console.log('Successfully parsed balanced data array with', data.length, 'rows');
              // Skip the rest of the data extraction since we've handled it
              if (config.data.length > 0) {
                console.log('Final data structure:', config.data);
                console.log('=== END TABLE PARSING ===');
                return config;
              }
            }
          } catch (e) {
            console.error('Error parsing balanced data section:', e);
            // Continue to regular data extraction below
          }
        }
      }
      
      // Regular fallback data pattern if the above approach fails
      const dataPattern = /data:\s*(\[\s*\[[\s\S]*?\]\s*\])/i;
      
      console.log('Looking for data pattern in:', configText);
      const dataMatch = configText.match(dataPattern);
      
      if (dataMatch) {
        console.log('Data pattern matched:', dataMatch[0]);
        
        try {
          // Clean up the data string
          let dataStr = dataMatch[1];
          console.log('Raw data string:', dataStr);
          
          // Check if this looks like multiple rows (better estimate with nested arrays)
          const rowCount = (dataStr.match(/\[\s*["']/g) || []).length;
          console.log('Detected approximately', rowCount, 'row opening brackets');
          
          try {
            // Clean and normalize the data string for better parsing
            // Replace single quotes with double quotes
            dataStr = dataStr.replace(/'/g, '"');
            // Ensure commas between array elements are properly placed
            dataStr = dataStr.replace(/\]\s*\[/g, '], [');
            // Remove trailing commas which are invalid in JSON
            dataStr = dataStr.replace(/,\s*\]/g, ']');
            // Fix any potential extra spaces next to commas
            dataStr = dataStr.replace(/\s+,\s+/g, ', ');
            
            console.log('Cleaned data string for parsing:', dataStr);
            
            const parsedData = JSON.parse(dataStr);
            console.log('Parsed data JSON successfully:', parsedData);
            console.log('Parsed data is array?', Array.isArray(parsedData));
            console.log('Parsed data length:', parsedData.length);
            
            config.data = parsedData;
            console.log('Final data structure:', config.data);
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError.message);
            throw jsonError; // Rethrow to trigger manual parsing
          }
        } catch (e) {
          console.error('Error parsing data JSON:', e);
          console.error('Data string was:', dataMatch[1]);
          
          // Fallback: try to parse manually
          try {
            console.log('Attempting manual parsing of data rows');
            // Get the full data section
            console.log('Looking for complete data section in raw content');
            const fullDataMatch = configText.match(/data:\s*(\[\s*[\s\S]*?\]\s*\])\s*$/);
            const rawData = fullDataMatch ? fullDataMatch[1] : dataMatch[1];
            
            console.log('Raw data for manual parsing:', rawData);
            
            // Extract rows directly from the complete data text
            let rows = [];
            
            try {
              // First, let's try to find all the row arrays in one go with regex
              const rowMatches = Array.from(rawData.matchAll(/\[\s*"([^"]*)"(?:\s*,\s*"([^"]*)")*\s*\]/g));
              if (rowMatches && rowMatches.length > 0) {
                console.log('Found', rowMatches.length, 'row matches with regex');
                
                rows = rowMatches.map(match => {
                  // Each match is one row, extract all cells using a dedicated regex
                  const cellMatches = Array.from(match[0].matchAll(/"([^"]*)"/g));
                  return cellMatches.map(cellMatch => cellMatch[1]);
                });
                
                console.log('Extracted rows using regex pattern:', rows);
              } else {
                // If the regex approach didn't work, try a line-by-line approach
                console.log('Using line-by-line parsing approach');
                
                // Remove whitespace and split by line
                const lines = rawData.trim().split('\n');
                console.log('Raw data split into', lines.length, 'lines');
                
                // Process each line that looks like a row
                lines.forEach(line => {
                  if (line.trim().startsWith('[') && line.includes('"')) {
                    // This looks like a row definition
                    try {
                      // Try to parse the line as JSON
                      let parsedLine = line.trim();
                      
                      // Ensure it has closing bracket
                      if (!parsedLine.endsWith(']') && !parsedLine.endsWith('],')) {
                        parsedLine += ']';
                      }
                      
                      // Remove trailing comma if present
                      parsedLine = parsedLine.replace(/,\s*$/, '');
                      
                      // Replace single quotes with double quotes
                      parsedLine = parsedLine.replace(/'/g, '"');
                      
                      console.log('Attempting to parse row line:', parsedLine);
                      const rowData = JSON.parse(parsedLine);
                      rows.push(rowData);
                    } catch (parseError) {
                      console.error('Failed to parse row line:', line, parseError);
                      
                      // Last resort: manual string splitting
                      const cells = line.match(/"([^"]*)"/g);
                      if (cells) {
                        rows.push(cells.map(cell => cell.replace(/^"|"$/g, '')));
                      }
                    }
                  }
                });
                
                console.log('Extracted rows using line-by-line parsing:', rows);
              }
            } catch (regexError) {
              console.error('Error in manual row extraction:', regexError);
              
              // Ultimate fallback: try to parse the entire data blob
              try {
                console.log('Attempting to clean and parse full data blob');
                
                // Clean up the data string for better parsing chances
                let cleanData = rawData.replace(/'/g, '"').replace(/,\s*\]/g, ']');
                cleanData = cleanData.replace(/\]\s*,?\s*\[/g, '],[');
                
                // Try to parse the whole structure
                const parsedData = JSON.parse(cleanData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                  rows = parsedData;
                  console.log('Successfully parsed full data blob:', rows);
                }
              } catch (fullParseError) {
                console.error('Failed to parse full data blob:', fullParseError);
              }
            }
            
            console.log('Manually parsed rows:', rows);
            console.log('Row count:', rows.length);
            
            config.data = rows;
          } catch (manualError) {
            console.error('Manual parsing also failed:', manualError);
          }
        }
      } else {
        console.error('No data pattern matched in table configuration');
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
    
    // Replace table commands with a placeholder using our single pattern
    TABLE_PATTERN.lastIndex = 0;
    result = result.replace(TABLE_PATTERN, 
      () => `[Data table created - Check the workspace panel]`);
    
    return result;
  }
  
  /**
   * A simple hashing function to generate a numeric hash from a string
   * Used to create more unique IDs for tables
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Make sure the hash is positive and reasonably sized
    return Math.abs(hash % 10000);
  }

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