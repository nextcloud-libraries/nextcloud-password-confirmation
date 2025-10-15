<!--
 - SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 - SPDX-License-Identifier: MIT
 -->

<script setup lang="ts">
import { isAxiosError } from '@nextcloud/axios'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import NcButton from '@nextcloud/vue/components/NcButton'
import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon'
import NcPasswordField from '@nextcloud/vue/components/NcPasswordField'
import { t } from '../utils/l10n.js'
import { logger } from '../utils/logger.js'

type ICanFocus = {
	focus: () => void
	select: () => void
}

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

const passwordInput = useTemplateRef<ICanFocus>('field')

const password = ref('')
const loading = ref(false)
const hasError = ref<boolean | 403>(false)

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
async function confirm(): Promise<void> {
	hasError.value = false
	loading.value = true

	if (password.value === '') {
		hasError.value = true
		return
	}

	try {
		await props.validate(password.value)
		emit('close', true)
	} catch (error) {
		if (isAxiosError(error) && error.response?.status === 403) {
			hasError.value = 403
		} else {
			hasError.value = true
		}

		logger.error('Exception during password confirmation', { error })
		selectPasswordField()
	} finally {
		loading.value = false
	}
}

/**
 * Handle the close event.
 *
 * @param open - The new status
 */
function close(open: boolean): void {
	if (!open) {
		emit('close', false)
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
		:name="t('Authentication required')"
		content-classes="vue-password-confirmation"
		@update:open="close">
		<!-- Dialog content -->
		<p>{{ t('This action needs authentication, please confirm it by entering your password.') }}</p>
		<form class="vue-password-confirmation__form" @submit.prevent="confirm">
			<NcPasswordField
				ref="field"
				v-model="password"
				:label="t('Password')"
				:helper-text="helperText"
				:error="hasError !== false"
				required />
			<NcButton
				class="vue-password-confirmation__submit"
				variant="primary"
				type="submit"
				:disabled="!password || loading">
				<template v-if="loading" #icon>
					<NcLoadingIcon :size="20" />
				</template>
				{{ t('Confirm') }}
			</NcButton>
		</form>
	</NcDialog>
</template>

<style lang="scss">
.vue-password-confirmation {
	display: flex;
	flex-direction: column;
	margin-inline: 6px;
	margin-block-end: 6px;
	gap: 10px 0;

	&__form {
		display: flex;
		flex-direction: column;
		gap: 8px 0;
		// allow focus visible outlines
		padding: 2px;
	}

	&__submit {
		align-self: end;
	}
}
</style>
