var socket = new SockJS('/ws'); 
var stompClient = Stomp.over(socket);

function connectWebSocket() {
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);

        function subscribeToDevice(deviceId) {
            stompClient.subscribe('/topic/ticketCounts/' + deviceId, function (messageOutput) {
                document.getElementById('ticketCount').textContent = 'Tickets: ' + messageOutput.body;
            });
        }

        window.requestTicketCount = function () {
            var deviceId = document.getElementById('deviceId').value;
            stompClient.send("/app/requestTicketCount", {}, deviceId);
            subscribeToDevice(deviceId);
        };

        // Attach the function to the button click event
        document.getElementById('requestButton').addEventListener('click', window.requestTicketCount);
    });
}