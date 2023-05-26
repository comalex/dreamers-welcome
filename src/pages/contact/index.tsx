import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Content } from '../../styles/global'
import {
    getAllProperties,
    getAllPropertiesForPaths,
    getProperty,
} from '../../_lib/api'
import Header from '../../_components/Typography/Header'
import {
    FormContainer,
    StyledInput,
    StyledSelect,
    StyledTextarea,
    StyledSelectWrapper,
    StyledSuccessBodyText,
} from '../../styles/contact/styles'
import Chevron from '../../_components/UI/Icons/Chevron'
import safeJsonStringify from 'safe-json-stringify'
import {sendConversionEvent} from '../api/fbConversionApi';
import crypto from 'crypto'

const Contact = ({ properties, setNavTheme, setHeaderData }: any) => {
    useEffect(() => {
        setNavTheme('dark')
        setHeaderData({
            simpleNav: false,
            property: undefined,
        })
    }, [])

    const [inProgress, setInProgress] = useState(false)

    const [submitted, setSubmitted] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()

    const _handleSubmit = (data: any) => {
        if (inProgress) {
            return
        }
        setInProgress(true)
        if (!data.subject.length) {
            data.subject = 'OTHER'
        }

        if (!data.property.length) {
            data.property = 'GENERAL PROPERTY'
        }

        if (data.property !== 'GENERAL PROPERTY') {
            const propertyObj = properties.filter((x: any) => {
                return (
                    `${x.propertyName.toUpperCase()} (${x.bucket[0]})` ===
                    data.property
                )
            })[0]
            data.bucket = propertyObj.bucket[0].toUpperCase()
        } else {
            data.bucket = 'DESTINATION N/A'
        }
        let hashedEmail = crypto.createHash('sha256').update(JSON.stringify(data.email)).digest('hex');
        const contactEvent = {
            event_name: 'Contact',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://www.dreamerswelcome.com/contact',
            event_id: 'contact',
            user_data: {
              em: [hashedEmail],
              client_user_agent: navigator.userAgent,
              ph: []
            },
            custom_data: {
              name: data.name,
              property: data.property,
              subject : data.subject,
              message: data.message
            }
          };
        sendConversionEvent(contactEvent);
        fetch('/api/contact', {
            method: 'POST',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then((res) => {
            if (res.status === 200) {
                window.scrollTo({
                    behavior: 'smooth',
                    top: 0,
                })
                setInProgress(false)
                setSubmitted(true)
            } else {
                setInProgress(false)
            }
        })
    }

    // @ts-ignore
    return (
        <Content padding>
            <div style={{ margin: '0 15px' }}>
                {!submitted ? (
                    <FormContainer>
                        <Header size={4}>CONTACT</Header>
                        <Header size={2}>Get in touch with us!</Header>
                        <form
                            onSubmit={handleSubmit((data) =>
                                _handleSubmit(data)
                            )}
                        >
                            <StyledInput
                                {...register('name', { required: true })}
                                placeholder="FULL NAME"
                            />
                            {errors.name && <p>Please enter your full name.</p>}
                            <StyledInput
                                placeholder="EMAIL"
                                type="email"
                                {...register('email', { required: true })}
                            />
                            {errors.email && (
                                <p>Please enter an email format.</p>
                            )}
                            <StyledSelectWrapper>
                                <StyledSelect
                                    {...register('subject', {
                                        required: false,
                                    })}
                                >
                                    <option value="" disabled selected>
                                        SUBJECT
                                    </option>
                                    <option>GENERAL INQUIRIES</option>
                                    <option>PRESS & MEDIA</option>
                                    <option>BOOKINGS</option>
                                    <option>OTHER</option>
                                </StyledSelect>
                                <Chevron dark />
                            </StyledSelectWrapper>
                            <StyledSelectWrapper>
                                <StyledSelect
                                    {...register('property', {
                                        required: false,
                                    })}
                                >
                                    <>
                                        <option value="" disabled selected>
                                            SELECT PROPERTY
                                        </option>
                                        <option>GENERAL PROPERTY</option>
                                        {properties &&
                                            properties.length &&
                                            properties.map((p: any) => (
                                                <option>
                                                    {p.propertyName.toUpperCase()}{' '}
                                                    {`(${p.bucket[0]})`}
                                                </option>
                                            ))}
                                    </>
                                </StyledSelect>
                                <Chevron dark />
                            </StyledSelectWrapper>
                            <StyledTextarea
                                {...register('message', { required: true })}
                                placeholder="MESSAGE"
                            />
                            {errors.message && <p>Please enter message.</p>}
                            <StyledInput
                                type="submit"
                                value="MESSAGE US"
                                disabled={
                                    Object.keys(errors).length || inProgress
                                }
                            />
                        </form>
                    </FormContainer>
                ) : (
                    <StyledSuccessBodyText size="xlg">
                        Thank you for contacting us! We will be in touch
                        shortly.
                    </StyledSuccessBodyText>
                )}
            </div>
        </Content>
    )
}

export default Contact

export async function getStaticProps() {
    const rawData = await getAllPropertiesForPaths()
    const stringData = safeJsonStringify(rawData)
    const properties = JSON.parse(stringData)

    return {
        props: {
            properties,
        },
    }
}
