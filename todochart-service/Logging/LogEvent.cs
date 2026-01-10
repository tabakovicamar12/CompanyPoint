namespace ToDoChartService.Logging;

public record LogEvent(
    DateTime TimestampUtc,
    string Level,          
    string Url,            
    string CorrelationId,  
    string Service,        
    string Message
);
