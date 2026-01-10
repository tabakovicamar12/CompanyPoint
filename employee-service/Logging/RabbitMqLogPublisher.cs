using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace EmployeeService.Logging;

public class RabbitMqLogPublisher : IDisposable
{
    private const string ExchangeName = "employeeservice.logs";
    private const string QueueName = "employeeservice.logs.queue";

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
        _ch.QueueBind(QueueName, ExchangeName, "");
    }

    public void Publish(object logObj)
    {
        var json = JsonSerializer.Serialize(logObj);
        var body = Encoding.UTF8.GetBytes(json);
        _ch.BasicPublish(ExchangeName, "", null, body);
    }

    public void Dispose()
    {
        _ch?.Dispose();
        _conn?.Dispose();
    }
}
