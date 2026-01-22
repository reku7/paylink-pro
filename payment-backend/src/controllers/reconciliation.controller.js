import {
  manuallyReconcileTransaction,
  reconcileStuckTransactions,
  getReconciliationReport,
} from "../services/reconciliation.service.js";
import { forceSyncTransactionStatus } from "../services/payment.service.js";
import Transaction from "../models/Transaction.js";

// ========== UTILITY FUNCTIONS ==========
function validateTransactionRef(transactionRef) {
  if (!transactionRef || typeof transactionRef !== "string") {
    throw new Error("Valid transaction reference is required");
  }
  return transactionRef.trim();
}

function handleControllerError(error, context) {
  console.error(`❌ ${context} error:`, error.message);

  // Map specific errors to appropriate status codes
  if (error.message.includes("Transaction not found")) {
    return { status: 404, message: error.message };
  }

  if (error.message.includes("Unauthorized")) {
    return { status: 403, message: error.message };
  }

  // Default error
  return {
    status: 500,
    message: error.message || `Failed to ${context}`,
  };
}

// ========== RECONCILIATION CONTROLLERS ==========
export async function manualReconcile(req, res) {
  try {
    const { transactionRef } = req.params;
    const validatedRef = validateTransactionRef(transactionRef);

    const result = await manuallyReconcileTransaction(validatedRef);

    return res.status(200).json({
      success: true,
      message: "Manual reconciliation completed successfully",
      data: {
        transaction: {
          id: result.transaction?._id,
          internalRef: result.transaction?.internalRef,
          previousStatus: result.transaction?.status,
          currentStatus: result.normalizedStatus,
        },
        gateway: {
          status: result.gatewayResult?.status,
          normalizedStatus: result.normalizedStatus,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "manually reconcile transaction"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function forceSync(req, res) {
  try {
    const { transactionRef } = req.params;
    const validatedRef = validateTransactionRef(transactionRef);

    const result = await forceSyncTransactionStatus(validatedRef);

    return res.status(200).json({
      success: true,
      message: "Transaction force sync completed",
      data: {
        transaction: {
          id: result._id,
          internalRef: result.internalRef,
          status: result.status,
          gateway: result.gateway,
          amount: result.amount,
          currency: result.currency,
          paidAt: result.paidAt,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "force sync transaction"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function runReconciliationJob(req, res) {
  try {
    const { merchantId } = req.query; // Optional merchant filter
    const { limit = 100 } = req.body || {};

    const result = await reconcileStuckTransactions();

    return res.status(200).json({
      success: true,
      message: "Reconciliation job executed successfully",
      data: {
        summary: result,
        timestamp: new Date(),
        details: {
          processed: result.success + result.failed + result.stillProcessing,
          errors: result.errors,
          skipped: result.skipped || 0,
        },
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "run reconciliation job"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

// ========== ADDITIONAL RECONCILIATION ENDPOINTS ==========
export async function getReconciliationStatus(req, res) {
  try {
    const { merchantId, gateway, days = 7 } = req.query;

    const report = await getReconciliationReport(merchantId);

    return res.status(200).json({
      success: true,
      data: {
        report,
        timestamp: new Date(),
        filters: {
          merchantId,
          gateway,
          days,
        },
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "fetch reconciliation status"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function batchReconcile(req, res) {
  try {
    const { transactionRefs, merchantId } = req.body;

    if (!Array.isArray(transactionRefs) || transactionRefs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "transactionRefs array is required and cannot be empty",
      });
    }

    if (transactionRefs.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Batch size cannot exceed 50 transactions",
      });
    }

    const results = {
      success: [],
      failed: [],
      errors: [],
    };

    // Process transactions in parallel with limits
    const batchSize = 10;
    for (let i = 0; i < transactionRefs.length; i += batchSize) {
      const batch = transactionRefs.slice(i, i + batchSize);

      const batchPromises = batch.map(async (ref) => {
        try {
          const result = await manuallyReconcileTransaction(ref);
          results.success.push({
            transactionRef: ref,
            status: result.normalizedStatus,
          });
          return { ref, status: "success" };
        } catch (error) {
          results.errors.push({
            transactionRef: ref,
            error: error.message,
          });
          return { ref, status: "error", error: error.message };
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches
      if (i + batchSize < transactionRefs.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return res.status(200).json({
      success: true,
      message: "Batch reconciliation completed",
      data: {
        summary: {
          total: transactionRefs.length,
          successful: results.success.length,
          failed: results.failed.length,
          errors: results.errors.length,
        },
        details: {
          successful: results.success,
          errors: results.errors,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "batch reconcile transactions"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function findStuckTransactions(req, res) {
  try {
    const { merchantId, gateway, hours = 1, limit = 50, page = 1 } = req.query;

    // Build query for stuck transactions
    const query = { status: "processing" };
    if (merchantId) query.merchantId = merchantId;
    if (gateway) query.gateway = gateway;

    // Calculate date threshold
    const thresholdDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    query.updatedAt = { $lt: thresholdDate };

    // Get paginated results
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ updatedAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    // Calculate age for each transaction
    const enhancedTransactions = transactions.map((tx) => ({
      id: tx._id,
      internalRef: tx.internalRef,
      amount: tx.amount,
      currency: tx.currency,
      gateway: tx.gateway,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      ageInHours: Math.round(
        (Date.now() - new Date(tx.updatedAt).getTime()) / (1000 * 60 * 60)
      ),
      linkId: tx.linkId,
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: enhancedTransactions,
        summary: {
          total,
          stuck: transactions.length,
          byGateway: transactions.reduce((acc, tx) => {
            acc[tx.gateway] = (acc[tx.gateway] || 0) + 1;
            return acc;
          }, {}),
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        filters: {
          merchantId,
          gateway,
          hours,
        },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    const { status, message } = handleControllerError(
      error,
      "find stuck transactions"
    );
    return res.status(status).json({
      success: false,
      message,
    });
  }
}
