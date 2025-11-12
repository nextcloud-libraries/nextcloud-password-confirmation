<!--
 - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

<script setup lang="ts">
import { isAxiosError } from '@nextcloud/axios'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcPasswordField from '@nextcloud/vue/components/NcPasswordField'
import { t } from '../utils/l10n.js'
import { logger } from '../utils/logger.js'

type DialogButtons = InstanceType<typeof NcDialog>['$props']['buttons']

const props = defineProps<{
	/**
	 * Function to call to validate password
	 */
	validate: (password: string) => Promise<void> | void
}>()

const emit = defineEmits<{
	close: [confirmed: boolean]
}>()

onMounted(focusPasswordField)

const passwordInput = useTemplateRef('field')

const password = ref('')
const loading = ref(false)
const hasError = ref<boolean | 403>(false)

const buttons: DialogButtons = [{
	label: t('Confirm'),
	type: 'submit',
	variant: 'primary',
	callback,
}]

const helperText = computed(() => {
	if (hasError.value !== false) {
		if (password.value === '') {
			return t('Please enter your password')
		}

		switch (hasError.value) {
			case true:
				return t('Unknown error while checking password')
			case 403:
				return t('Wrong password')
		}
	}

	if (loading.value) {
		return t('Checking password …') // TRANSLATORS: This is a status message, shown when the system is checking the users password
	}

	return ''
})

/**
 * Handle confirm button click
 */
async function callback(): Promise<boolean> {
	hasError.value = false
	loading.value = true

	if (password.value === '') {
		hasError.value = true
		return false
	}

	try {
		await props.validate(password.value)
		emit('close', true)
		return true
	} catch (error) {
		if (isAxiosError(error) && error.response?.status === 403) {
			hasError.value = 403
		} else {
			hasError.value = true
		}

		logger.error('Exception during password confirmation', { error })
		selectPasswordField()
		return false
	} finally {
		loading.value = false
	}
}

/**
 * Focus the password field
 */
function focusPasswordField() {
	nextTick(() => {
		passwordInput.value!.focus()
	})
}

/**
 * Select the password field
 */
function selectPasswordField() {
	nextTick(() => {
		passwordInput.value!.select()
	})
}
</script>

<template>
	<NcDialog
		is-form
		:buttons
		:name="t('Authentication required')"
		:content-classes="$style.passwordDialog"
		@update:open="emit('close', false)">
		<p>{{ t('This action needs authentication, please confirm it by entering your password.') }}</p>
		<NcPasswordField
			ref="field"
			v-model="password"
			:label="t('Password')"
			:helper-text="helperText"
			:check-password-strength="false"
			:error="hasError !== false"
			required />
	</NcDialog>
</template>

<style module>
.passwordDialog {
	display: flex;
	flex-direction: column;
	gap: 10px 0;
	margin-inline: 6px;
	margin-block-end: 6px;
}
</style>
