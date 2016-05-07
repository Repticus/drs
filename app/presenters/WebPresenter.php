<?php

use Nette\Application\UI\Form,
	Nette\Utils\Finder,
	Nette\Mail\Message;

class WebPresenter extends Nette\Application\UI\Presenter {

	/** @persistent */
	public $course;

	public function actionTerapeuti() {
		$this->template->therapist = $this->context->parameters['therapist'];
	}

	public function actionAktuality() {
		$this->setCourseList();
	}

	public function handleRegistration($course) {
		$this->course = $course;
		$this->invalidateControl('courses');
	}

	private function setCourseList() {
		$courses = $this->context->parameters['courses'];
		$thisDate = mktime(0, 0, 0, date("m"), date("d"), date("Y"));
		foreach ($courses as $courseKey => $course) {
			foreach ($course['dates'] as $dateKey => $date) {
				$date = strtotime($date['date']);
				if ($date < $thisDate) {
					unset($courses[$courseKey]['dates'][$dateKey]);
				}
			}
			$count = count($courses[$courseKey]['dates']);
			if (!$count) {
				unset($courses[$courseKey]);
			} else {

			}
		}
		$this->template->courses = $courses;
	}

	public function getGalleryImages($name) {
		try {
			foreach (Finder::findFiles("*.jpg")->in("glr/" . $name . "/sm/") as $file) {
				if (file_exists("glr/" . $name . "/fl/" . $file->getFilename())) {
					$index = substr_replace($file->getFilename(), "", -4);
					$gallery[$index]['sm'] = "glr/" . $name . "/sm/" . $file->getFilename();
					$gallery[$index]['fl'] = "glr/" . $name . "/fl/" . $file->getFilename();
				}
			}
			ksort($gallery);
			return $gallery;
		} catch (Exception $e) {
			return array();
		}
	}

	protected function createComponentCourseRegistration() {
		$msgNameReq = "Zadejte prosím jméno a příjmení.";
		$msgEmailReq = "Zadejte prosím emailovou adresu.";
		$msgPhoneReq = "Zadejte prosím telefonní číslo.";
		$msgPhoneBad = "Telefon není správně vyplněn.";
		$msgDateReq = "Vyberte prosím termín akce.";
		$persons = array('1 osoba', '2 osoby', '3 osoby', '4 osoby', '5 osob');
		$dates = array();
		foreach ($this->context->parameters['courses'][$this->course]['dates'] as $date) {
			$dates[] = $this->template->date($date['date'], '%d.%m.%Y');
		}

		$form = new Form();
		$form->addText('name', 'Jméno', NULL, 60)
				->setAttribute('placeholder', 'Jméno a příjmení')
				->setAttribute('tabindex', 1)
				->addRule(~$form::EQUAL, $msgNameReq, $form['name']->control->attrs['placeholder'])
				->setRequired($msgNameReq);
		$form->addText('email', 'Email', NULL, 40)
				->setAttribute('placeholder', 'Email')
				->setAttribute('tabindex', 2)
				->addRule(~$form::EQUAL, $msgEmailReq, $form['email']->control->attrs['placeholder'])
				->setRequired($msgEmailReq)
				->addRule(Form::EMAIL, '%label není správně vyplněn.');
		$form->addText('phone', 'Telefon', NULL, 9)
				->setAttribute('placeholder', 'Telefon')
				->setAttribute('tabindex', 3)
				->addRule(~$form::EQUAL, $msgPhoneReq, $form['phone']->control->attrs['placeholder'])
				->setRequired($msgPhoneReq)
				->addRule(Form::INTEGER, $msgPhoneBad)
				->addRule(Form::LENGTH, $msgPhoneBad, 9);
		$form->addSelect('date', 'Termín konání')
				->setPrompt('Zvolte termín konání')
				->setItems($dates)
				->setRequired($msgDateReq);
		if (count($dates) == 1) {
			$form['date']->setDefaultValue(0);
		}
		$form->addSelect('person', 'Počet')
				->setItems($persons, FALSE);
		$form->addTextArea('note', 'Poznámka', NULL)
				->setAttribute('placeholder', 'Jakýkoli dotaz nebo zpráva.')
				->setAttribute('tabindex', 4)
				->addRule(Form::MAX_LENGTH, 'Poznámka může obsahovat maximálně 1000 znaků.', 1000);
		$form->addSubmit('send', 'Odeslat')
				->setAttribute('tabindex', 5)
				->setAttribute('class', 'button');
		$form->addSubmit('storno', 'Storno')
				->setAttribute('tabindex', 6)
				->setValidationScope(NULL)
				->setAttribute('class', 'button');
		$form->addHidden('spamtest')
				->addRule($form::EQUAL, 'Robot', array(NULL));
		$form->onSuccess[] = callback($this, 'submitRegistration');
		return $form;
	}

	public function submitRegistration($form) {
		if ($form['send']->isSubmittedBy()) {
			$this->template->courseId = $this->course;
			$flashMessage = "Děkujeme, Vaše registrace byla úspěšně odeslána. Na zadaný email byly zaslány informace o Vaší registraci.";
			$this->flashMessage($flashMessage, 'success');
			$this->sendMail($form);
		}
		$this->course = null;
		$this->invalidateControl('courses');
	}

	public function sendMail($form) {
		$ownerMail = $this->context->parameters['owner']['mail'];
		$ownerName = $this->context->parameters['owner']['name'];
		$backupMail = $this->context->parameters['backup']['mail'];
		$backupName = $this->context->parameters['backup']['name'];
		$clientMail = $form['email']->value;
		$clientName = $form['name']->value;
		$template = $this->createTemplate();
		$template->setFile(__DIR__ . "/../templates/Mail/clientCourseReservation.latte");
		$template->date = $form['date']->value;
		$template->courseData = $this->context->parameters['courses'][$this->course];
		$template->personalData = $this->setPersonalData($form);
		$mail = new Message;
		$mail->setFrom($ownerMail, $ownerName)
				->addTo($clientMail, $clientName)
				->setHtmlBody($template)
				->send();
		$template->setFile(APP_DIR . "/templates/Mail/ownerCourseReservation.latte");
		$mail->setFrom($clientMail, $clientName)
				->clearHeader('To')
				->addTo($ownerMail, $ownerName)
				->send();
//		$mail->clearHeader('To')
//				->addTo($backupMail, $backupName)
//				->send();
	}

	private function setPersonalData($form) {
		unset($form['date']);
		unset($form['spamtest']);
		unset($form['send']);
		unset($form['storno']);
		foreach ($form->components as $name => $control) {
			$field['caption'] = $control->caption;
			$field['value'] = $control->value;
			if ($field['value']) {
				$personalData[$name] = $field;
			}
		}
		return ($personalData);
	}

}
