// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CurveWhispererOracle {
    struct Score {
        uint8 score;
        uint40 timestamp;
        string reason;
        string confidence;
    }

    address public owner;
    mapping(address => Score) public scores;
    mapping(address => Score[]) private scoreHistories;

    event ScoreUpdated(
        address indexed token,
        uint8 score,
        string confidence,
        uint40 timestamp
    );

    event TokenGraduated(address indexed token, uint40 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function updateScore(
        address token,
        uint8 _score,
        string calldata reason,
        string calldata confidence
    ) external onlyOwner {
        require(_score <= 100, "Score must be 0-100");

        Score memory s = Score({
            score: _score,
            timestamp: uint40(block.timestamp),
            reason: reason,
            confidence: confidence
        });

        scores[token] = s;
        scoreHistories[token].push(s);

        emit ScoreUpdated(token, _score, confidence, uint40(block.timestamp));
    }

    function markGraduated(address token) external onlyOwner {
        emit TokenGraduated(token, uint40(block.timestamp));
    }

    function getScore(address token) external view returns (Score memory) {
        return scores[token];
    }

    function getScoreHistory(
        address token,
        uint256 limit
    ) external view returns (Score[] memory) {
        Score[] storage history = scoreHistories[token];
        uint256 len = history.length;
        if (len == 0) return new Score[](0);

        uint256 count = limit < len ? limit : len;
        Score[] memory result = new Score[](count);
        uint256 start = len - count;
        for (uint256 i = 0; i < count; i++) {
            result[i] = history[start + i];
        }
        return result;
    }

    function getScoreHistoryLength(address token) external view returns (uint256) {
        return scoreHistories[token].length;
    }
}
