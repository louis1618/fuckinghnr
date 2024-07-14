document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // 서버와의 WebSocket 연결

    const voteButton = document.getElementById('vote-button');
    const voteCountDisplay = document.getElementById('vote-count');
    let voteCount = 0;

    voteButton.addEventListener('click', () => {
        socket.emit('vote');
    });

    // 서버에서 'updateVoteCount' 이벤트를 수신하여 화면 업데이트
    socket.on('updateVoteCount', (newCount) => {
        voteCount = newCount;
        voteCountDisplay.textContent = voteCount;
    });

    socket.on('connect', () => {
        console.log('서버에 연결되었습니다.');
        socket.emit('getInitialVoteCount'); // 초기 데이터 요청 가능
    });

    socket.on('disconnect', () => {
        console.log('서버와의 연결이 끊어졌습니다.');
    });

    socket.on('error', (error) => {
        console.error('Socket 오류:', error);
    });
});
