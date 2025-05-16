<template>
  <van-popup
    :show="show"
    round
    closeOnClickOverlay
    position="center"
    :style="{width: '90%', maxWidth: '400px'}"
    @click:overlay="$emit('update:show', false)"
    @update:show="handleUpdateShow"
  >
    <div class="transaction-detail" v-if="transaction">
      <div class="header">
        <van-icon
          :name="getCategoryIcon(transaction.categoryId)"
          :style="{color: getCategoryColor(transaction.categoryId)}"
          size="36"
        />
        <h2>{{ getCategoryName(transaction.categoryId) }}</h2>
      </div>

      <div class="details">
        <div class="detail-item">
          <span class="label">{{ $t('transaction.amount') }}:</span>
          <span class="value">€{{ formatAmount(transaction.amount) }}</span>
        </div>

        <div class="detail-item">
          <span class="label">{{ $t('transaction.date') }}:</span>
          <span class="value">{{
            formatTransactionDate(transaction.timestamp)
          }}</span>
        </div>

        <div class="detail-item" v-if="transaction.description">
          <span class="label">{{ $t('transaction.description') }}:</span>
          <span class="value">{{ transaction.description }}</span>
        </div>
      </div>

      <div class="actions">
        <van-button plain type="primary" @click="$emit('edit')">
          {{ $t('common.edit') }}
        </van-button>
        <van-button plain type="danger" @click="$emit('delete')">
          {{ $t('common.delete') }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import type {Transaction} from '@/types/transaction';
import {defineProps, defineEmits} from 'vue';

const props = defineProps<{
  show: boolean;
  transaction: Transaction | null;
  getCategoryName: (id: string) => string;
  getCategoryColor: (id: string) => string;
  getCategoryIcon: (id: string) => string;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
  (e: 'update:show', value: boolean): void;
}>();

function formatAmount(amount: number) {
  return Number(amount).toFixed(2);
}

function formatTransactionDate(timestamp: number | string) {
  if (!timestamp) return '';
  const date =
    typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString();
}

function handleUpdateShow(show: boolean) {
  emit('update:show', show);
}
</script>

<style scoped>
.transaction-detail {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 18px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
