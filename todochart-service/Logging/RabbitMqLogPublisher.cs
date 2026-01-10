using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace ToDoChartService.Logging;

public class RabbitMqLogPublisher : IDisposable
{
    private const string ExchangeName = "todochartservice.logs";
    private const string QueueName = "todochartservice.logs.queue";

    private readonly IConnection _conn;
    private readonly IModel _ch;

    public RabbitMqLogPublisher()
    {
        var factory = new ConnectionFactory
        {
            HostName = Environment.GetEnvironmentVariable("RABBITMQ_HOST") ?? "rabbitmq"
        };

        _conn = factory.CreateConnection();
        _ch = _conn.CreateModel();

        _ch.ExchangeDeclare(ExchangeName, ExchangeType.Fanout, durable: true);
        _ch.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);
        _ch.QueueBind(QueueName, ExchangeName, routingKey: "");
    }

    public void Publish(object logObj)
    {
        var json = JsonSerializer.Serialize(logObj);
        var body = Encoding.UTF8.GetBytes(json);

        var props = _ch.CreateBasicProperties();
        props.Persistent = true;

        _ch.BasicPublish(exchange: ExchangeName, routingKey: "", basicProperties: props, body: body);
    }

    public void Dispose()
    {
        try { _ch?.Close(); } catch { }
        try { _conn?.Close(); } catch { }
        _ch?.Dispose();
        _conn?.Dispose();
    }
}
