<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <div class="reminders-page">
      <!-- Calendar Section (top 2/3) -->
      <div class="calendar-section">
        <van-calendar
          v-model:show="showCalendar"
          :min-date="minDate"
          :max-date="maxDate"
          :show-confirm="false"
          :show-subtitle="true"
          :poppable="false"
          :style="{ height: '400px' }"
          @select="onSelectDate"
        >
          <template #day="{ date }">
            <div class="calendar-day">
              <span class="day-text">{{ date.day }}</span>
              <div v-if="getRemindersForDate(date).length > 0" class="reminder-dots">
                <div 
                  v-for="(reminder, index) in getRemindersForDate(date).slice(0, 3)" 
                  :key="index"
                  class="reminder-dot"
                  :style="{ backgroundColor: getReminderColor(reminder) }"
                ></div>
              </div>
            </div>
          </template>
        </van-calendar>
      </div>

      <!-- Upcoming Reminders Section (bottom 1/3) -->
      <div class="upcoming-section">
        <div class="section-header">
          <h3>{{ t('reminder.upcomingReminders') }}</h3>
        </div>

      <van-list
        v-if="remindersStore.futureReminders.length > 0"
        class="reminders-list"
      >
        <van-cell
          v-for="reminder in remindersStore.futureReminders.slice(0, 5)"
          :key="reminder.id"
          :title="reminder.name"
          :label="formatDueTime(reminder.dueTime)"
          class="reminder-item"
        >
          <template #right-icon>
            <van-button
              size="small"
              icon="edit"
              @click="editReminder(reminder)"
            />
            <van-button
              size="small"
              icon="delete"
              type="danger"
              @click="deleteReminder(reminder)"
            />
          </template>
        </van-cell>
      </van-list>

      <van-empty
        v-else
        :description="t('reminder.noReminders')"
        image="search"
      />
    </div>

    <!-- FAB for adding new reminder -->
    <van-button
      v-if="selectedDate"
      class="fab-add"
      type="primary"
      icon="plus"
      round
      size="large"
      @click="addReminderForSelectedDate"
    />

    <!-- Add/Edit Reminder Modal -->
    <van-popup
      v-model:show="showAddModal"
      round
      position="bottom"
      :style="{ height: '70%' }"
      closeable
    >
      <div class="modal-content">
        <h3>{{ isEditing ? t('reminder.edit') : t('reminder.add') }}</h3>
        
        <van-form @submit="saveReminder">
          <van-field
            v-model="formData.name"
            :label="t('reminder.name')"
            :placeholder="t('reminder.pleaseEnterName')"
            :rules="[{ required: true, message: t('reminder.pleaseEnterName') }]"
          />



          <van-field
            :label="t('reminder.reminderSchedule')"
            readonly
            :placeholder="t('reminder.pleaseSelectSchedule')"
            @click="showSchedulePicker = true"
            :rules="[{ required: true, message: t('reminder.pleaseSelectSchedule') }]"
          >
            <template #input>
              <div class="schedule-display">
                {{ formatScheduleDisplay() }}
              </div>
            </template>
          </van-field>

          <div class="form-actions">
            <van-button
              type="default"
              @click="cancelEdit"
            >
              {{ t('reminder.cancel') }}
            </van-button>
            <van-button
              type="primary"
              native-type="submit"
              :loading="loading"
            >
              {{ t('reminder.save') }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>



    <!-- Schedule Picker -->
    <van-popup
      v-model:show="showSchedulePicker"
      round
      position="bottom"
      :style="{ height: '50%' }"
    >
      <div class="schedule-picker">
        <h4>{{ t('reminder.reminderSchedule') }}</h4>
        <van-checkbox-group v-model="formData.reminderSchedule">
          <van-cell-group>
            <van-cell
              v-for="(label, value) in scheduleOptions"
              :key="value"
              :title="label"
            >
              <template #right-icon>
                <van-checkbox :name="value" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-checkbox-group>
        <div class="schedule-actions">
          <van-button
            type="primary"
            @click="showSchedulePicker = false"
          >
            {{ t('common.confirm') }}
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- Day Details Modal -->
    <van-popup
      v-model:show="showDayDetails"
      round
      position="bottom"
      :style="{ height: '50%' }"
      closeable
    >
      <div class="day-details">
        <h3>{{ t('reminder.remindersForDate', { date: formatDate(selectedDate) }) }}</h3>
        
        <van-list v-if="selectedDateReminders.length > 0">
          <van-cell
            v-for="reminder in selectedDateReminders"
            :key="reminder.id"
            :title="reminder.name"
            :label="formatDueTime(reminder.dueTime)"
          >
            <template #right-icon>
              <van-button
                size="small"
                icon="edit"
                @click="editReminder(reminder)"
              />
              <van-button
                size="small"
                icon="delete"
                type="danger"
                @click="deleteReminder(reminder)"
              />
            </template>
          </van-cell>
        </van-list>

        <van-empty
          v-else
          :description="t('reminder.noRemindersForDate')"
          image="search"
        />
      </div>
    </van-popup>
    </div>
  </van-pull-refresh>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { showNotify, showConfirmDialog } from 'vant';
import { useRemindersStore } from '@/stores/modules/reminders';
import { useUserStore } from '@/stores/modules/user';
import type { Reminder, ReminderFormData } from '@/types/reminder';

const { t } = useI18n();
const remindersStore = useRemindersStore();
const userStore = useUserStore();

// State
const showCalendar = ref(false);
const showAddModal = ref(false);
const showSchedulePicker = ref(false);
const showDayDetails = ref(false);
const loading = ref(false);
const refreshing = ref(false);
const isEditing = ref(false);
const editingReminderId = ref<string | null>(null);
const selectedDate = ref<Date | null>(null);

// Form data
const formData = reactive<ReminderFormData>({
  name: '',
  dueTime: '',
  reminderSchedule: [],
});

// Constants
const minDate = new Date(new Date().getFullYear() - 1, 0, 1);
const maxDate = new Date(new Date().getFullYear() + 2, 11, 31);

const scheduleOptions = {
  '1_DAY': t('reminder.scheduleOptions.1_DAY'),
  '2_DAYS': t('reminder.scheduleOptions.2_DAYS'),
  '1_WEEK': t('reminder.scheduleOptions.1_WEEK'),
  '1_MONTH': t('reminder.scheduleOptions.1_MONTH'),
};

// Computed
const selectedDateReminders = computed(() => {
  if (!selectedDate.value) return [];
  return remindersStore.getRemindersForDate(selectedDate.value);
});

// Methods
const onRefresh = async () => {
  try {
    await remindersStore.fetchReminders(userStore.userInfo.uid, true);
    showNotify({ type: 'success', message: t('reminder.refreshSuccess') });
  } catch (error) {
    showNotify({ type: 'danger', message: t('reminder.error') });
  } finally {
    refreshing.value = false;
  }
};

const onSelectDate = (date: Date) => {
  selectedDate.value = date;
  const reminders = remindersStore.getRemindersForDate(date);
  if (reminders.length > 0) {
    showDayDetails.value = true;
  }
  // Clear any previous form data when selecting a new date
  resetForm();
};

const getRemindersForDate = (date: any) => {
  const dateObj = new Date(date.year, date.month - 1, date.day);
  return remindersStore.getRemindersForDate(dateObj);
};

const getReminderColor = (reminder: Reminder) => {
  // Simple hash function for consistent colors
  let hash = 0;
  for (let i = 0; i < reminder.name.length; i++) {
    hash = reminder.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const formatDueTime = (dueTime: string) => {
  const date = new Date(dueTime);
  return date.toLocaleString();
};

const formatDate = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleDateString();
};

const formatScheduleDisplay = () => {
  if (formData.reminderSchedule.length === 0) return '';
  return formData.reminderSchedule
    .map(schedule => scheduleOptions[schedule])
    .join(', ');
};

const addReminderForSelectedDate = () => {
  if (selectedDate.value) {
    // Set the due time to the selected date at 9:00 AM
    const dueDate = new Date(selectedDate.value);
    dueDate.setHours(9, 0, 0, 0);
    formData.dueTime = dueDate.toISOString();
    showAddModal.value = true;
  }
};

const editReminder = (reminder: Reminder) => {
  isEditing.value = true;
  editingReminderId.value = reminder.id;
  formData.name = reminder.name;
  formData.dueTime = reminder.dueTime;
  formData.reminderSchedule = [...reminder.reminderSchedule];
  

  
  showAddModal.value = true;
};

const deleteReminder = async (reminder: Reminder) => {
  try {
    await showConfirmDialog({
      title: t('reminder.deleteConfirmTitle'),
      message: t('reminder.deleteConfirmMessage'),
    });
    
    await remindersStore.deleteReminder(userStore.userInfo.uid, reminder.id);
    showNotify({ type: 'success', message: t('reminder.deleteSuccess') });
  } catch (error) {
    if (error) {
      showNotify({ type: 'danger', message: t('reminder.deleteError') });
    }
  }
};

const saveReminder = async () => {
  try {
    loading.value = true;
    
    if (isEditing.value && editingReminderId.value) {
      await remindersStore.updateReminder(
        userStore.userInfo.uid,
        editingReminderId.value,
        formData
      );
      showNotify({ type: 'success', message: t('reminder.updateSuccess') });
    } else {
      await remindersStore.addReminder(userStore.userInfo.uid, formData);
      showNotify({ type: 'success', message: t('reminder.success') });
    }
    
    resetForm();
    showAddModal.value = false;
  } catch (error) {
    showNotify({ 
      type: 'danger', 
      message: isEditing.value ? t('reminder.updateError') : t('reminder.error') 
    });
  } finally {
    loading.value = false;
  }
};

const cancelEdit = () => {
  resetForm();
  showAddModal.value = false;
};

const resetForm = () => {
  formData.name = '';
  formData.dueTime = '';
  formData.reminderSchedule = [];
  isEditing.value = false;
  editingReminderId.value = null;

};

// Lifecycle
onMounted(async () => {
  try {
    await remindersStore.fetchReminders(userStore.userInfo.uid);
  } catch (error) {
    showNotify({ type: 'danger', message: t('reminder.error') });
  }
});
</script>

<style scoped>
.reminders-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--van-background-color);
}

.calendar-section {
  flex: 2;
  padding: 16px;
  background-color: var(--van-background-color-light);
}

.upcoming-section {
  flex: 1;
  padding: 16px;
  background-color: var(--van-background-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.reminders-list {
  max-height: 200px;
  overflow-y: auto;
}

.reminder-item {
  margin-bottom: 8px;
  border-radius: 8px;
}

.calendar-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 4px;
}

.day-text {
  font-size: 14px;
  margin-bottom: 2px;
}

.reminder-dots {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.reminder-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.fab-add {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
}

.modal-content {
  padding: 20px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  text-align: center;
}

.schedule-display {
  color: var(--van-text-color);
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.schedule-picker {
  padding: 20px;
}

.schedule-picker h4 {
  margin: 0 0 16px 0;
  text-align: center;
}

.schedule-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.day-details {
  padding: 20px;
}

.day-details h3 {
  margin: 0 0 16px 0;
  text-align: center;
}


</style>

<route lang="json5">
{
  name: 'reminders',
  meta: {
    title: 'Expense Reminders',
    i18n: 'reminder.title',
  },
}
</route> 