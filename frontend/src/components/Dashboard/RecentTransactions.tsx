import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  LocalBar as AlcoholIcon,
  SmokingRooms as TobaccoIcon,
  ShoppingCart as GeneralIcon,
  LocalPharmacy as MedicineIcon,
} from '@mui/icons-material';

interface Transaction {
  id: string;
  timestamp: string;
  productCategory: 'alcohol' | 'tobacco' | 'general' | 'medicine';
  productId: string;
  success: boolean;
  age?: number;
  processingTime: number;
  reason?: string;
}

const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Generate mock transactions
  const generateMockTransaction = (): Transaction => {
    const categories: Array<'alcohol' | 'tobacco' | 'general' | 'medicine'> = ['alcohol', 'tobacco', 'general', 'medicine'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const success = Math.random() > 0.15; // 85% success rate
    
    return {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      productCategory: category,
      productId: `${category}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      success,
      age: success ? Math.floor(Math.random() * 40) + 18 : undefined,
      processingTime: Math.floor(Math.random() * 3000) + 500,
      reason: success ? undefined : ['Card read failed', 'Biometric verification failed', 'Age requirement not met'][Math.floor(Math.random() * 3)],
    };
  };

  // Add new transactions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance of new transaction every 3 seconds
        setTransactions(prev => {
          const newTransaction = generateMockTransaction();
          const updated = [newTransaction, ...prev];
          return updated.slice(0, 10); // Keep only last 10 transactions
        });
      }
    }, 3000);

    // Initialize with some mock data
    const initialTransactions = Array.from({ length: 5 }, () => generateMockTransaction());
    setTransactions(initialTransactions);

    return () => clearInterval(interval);
  }, []);

  const getProductIcon = (category: string) => {
    switch (category) {
      case 'alcohol':
        return <AlcoholIcon color="warning" />;
      case 'tobacco':
        return <TobaccoIcon color="error" />;
      case 'medicine':
        return <MedicineIcon color="success" />;
      default:
        return <GeneralIcon color="primary" />;
    }
  };

  const getCategoryColor = (category: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (category) {
      case 'alcohol':
        return 'warning';
      case 'tobacco':
        return 'error';
      case 'medicine':
        return 'success';
      default:
        return 'primary';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const refreshTransactions = () => {
    const newTransactions = Array.from({ length: 5 }, () => generateMockTransaction());
    setTransactions(newTransactions);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <Tooltip title="Refresh transactions">
            <IconButton onClick={refreshTransactions} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {transactions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <PersonIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No recent transactions
            </Typography>
          </Box>
        ) : (
          <List dense>
            {transactions.map((transaction, index) => (
              <React.Fragment key={transaction.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {transaction.success ? (
                      <SuccessIcon color="success" />
                    ) : (
                      <FailIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {getProductIcon(transaction.productCategory)}
                        <Typography variant="body2" component="span">
                          {transaction.productId}
                        </Typography>
                        <Chip
                          label={transaction.productCategory}
                          size="small"
                          color={getCategoryColor(transaction.productCategory)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(transaction.timestamp)} • {transaction.processingTime}ms
                        </Typography>
                        {transaction.success ? (
                          <Typography variant="caption" color="success.main" display="block">
                            ✓ Verified • Age: {transaction.age}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main" display="block">
                            ✗ Failed • {transaction.reason}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < transactions.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        <Box mt={2} textAlign="center">
          <Typography variant="caption" color="text.secondary">
            Live transaction feed • Updates automatically
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
