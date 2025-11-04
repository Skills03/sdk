#!/bin/bash

###############################################################################
# Stop all Compute Chain services
###############################################################################

echo "🛑 Stopping Compute Chain services..."

# Kill by PID files
for service in blockchain docker-service provider frontend; do
    if [ -f "/tmp/${service}.pid" ]; then
        pid=$(cat "/tmp/${service}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            echo "   ✓ Stopped $service (PID $pid)"
        fi
        rm "/tmp/${service}.pid"
    fi
done

# Fallback: kill by process name
pkill -f "solochain-template-node" 2>/dev/null
pkill -f "node.*docker-service" 2>/dev/null
pkill -f "node.*provider-service" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

echo "✅ All services stopped"
